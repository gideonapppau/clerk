package webhooks

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"

	"github.com/clerk/core/internal/conversations"
	"github.com/clerk/core/internal/push"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func messageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
			return
		}
		var payload struct {
			MerchantID    string `json:"merchantId"`
			CustomerPhone string `json:"customerPhone"`
			Text          string `json:"text"`
			MessageKind   string `json:"messageKind"`
		}
		if err := json.Unmarshal(body, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
			return
		}

		if payload.MerchantID == "" || payload.CustomerPhone == "" || payload.Text == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "merchantId, customerPhone, and text are required"})
			return
		}

		var mode string
		err = db.QueryRow("SELECT COALESCE(mode, 'BOT') FROM conversations WHERE merchant_id = $1 AND customer_phone = $2",
			payload.MerchantID, payload.CustomerPhone).Scan(&mode)
		if err == nil && mode == "HUMAN" {
			_, _ = commerceSaveMessage(db, payload.MerchantID, payload.CustomerPhone, payload.Text)
			c.JSON(http.StatusOK, gin.H{"status": "ok", "mode": "human"})
			return
		}

		manager := conversations.NewManager(db)
		result, err := manager.HandleMessage(payload.MerchantID, payload.CustomerPhone, payload.Text)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process message"})
			return
		}

		if result.NeedsEscalation {
			go sendEscalationPush(db, payload.MerchantID, payload.CustomerPhone, payload.Text)
		}

		c.JSON(http.StatusOK, gin.H{
			"status":         "ok",
			"reply":          result.Reply,
			"conversationId": result.ConversationID,
			"state":          result.State,
			"orderId":        result.OrderID,
			"paymentUrl":     result.PaymentURL,
		})
	}
}

func commerceSaveMessage(db *sql.DB, merchantID, customerPhone, text string) (string, error) {
	var convoID string
	err := db.QueryRow("SELECT id FROM conversations WHERE merchant_id = $1 AND customer_phone = $2",
		merchantID, customerPhone).Scan(&convoID)
	if err != nil {
		return "", err
	}
	_, _ = db.Exec(`INSERT INTO messages (id, conversation_id, sender, body, created_at)
		VALUES ($1, $2, 'customer', $3, NOW())`, generateUUID(), convoID, text)
	return convoID, nil
}

func sendEscalationPush(db *sql.DB, merchantID, customerPhone, text string) {
	svc := push.NewService(db, "", "")
	svc.SendNotification(merchantID, "Customer needs help", "A customer on WhatsApp needs assistance. Open your dashboard to reply.")
}

func statusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload struct {
			MerchantID string `json:"merchantId"`
			Connected  bool   `json:"connected"`
			Phone      string `json:"phone"`
		}
		body, _ := io.ReadAll(c.Request.Body)
		_ = json.Unmarshal(body, &payload)
		if payload.Phone != "" {
			_, _ = db.Exec("UPDATE merchants SET connected = $1, phone = $2, updated_at = NOW() WHERE id = $3", payload.Connected, payload.Phone, payload.MerchantID)
		} else {
			_, _ = db.Exec("UPDATE merchants SET connected = $1, updated_at = NOW() WHERE id = $2", payload.Connected, payload.MerchantID)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func startupHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, _ = db.Exec("UPDATE merchants SET connected = false, updated_at = NOW() WHERE connected = true")
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func reachoutHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload struct {
			SessionID string `json:"sessionId"`
			Phone     string `json:"phone"`
		}
		body, _ := io.ReadAll(c.Request.Body)
		_ = json.Unmarshal(body, &payload)
		c.JSON(http.StatusOK, gin.H{
			"sessionId": payload.SessionID,
			"restricted": false,
			"reason":    "",
			"message":   "",
		})
	}
}

func reachoutGetHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"restricted": false,
			"reason":     "",
			"message":    "",
			"endsAt":     "",
			"since":      "",
		})
	}
}

func merchantMessageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload struct {
			ConversationID string `json:"conversationId"`
			From           string `json:"from"`
			Text           string `json:"text"`
			MessageKind    string `json:"messageKind"`
		}
		body, _ := io.ReadAll(c.Request.Body)
		_ = json.Unmarshal(body, &payload)

		if payload.ConversationID != "" && payload.Text != "" {
			var convoID string
			err := db.QueryRow("SELECT id FROM conversations WHERE id = $1", payload.ConversationID).Scan(&convoID)
			if err == nil {
				_, _ = db.Exec(`INSERT INTO messages (id, conversation_id, sender, body, created_at)
					VALUES ($1, $2, 'merchant', $3, NOW())`, generateUUID(), payload.ConversationID, payload.Text)
			}
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func RegisterWhatsApp(r *gin.RouterGroup, db *sql.DB) {
	wa := r.Group("/webhooks/whatsapp")
	wa.POST("/message", messageHandler(db))
	wa.POST("/status", statusHandler(db))
	wa.POST("/startup", startupHandler(db))
	wa.POST("/reachout", reachoutHandler(db))
	wa.GET("/reachout", reachoutGetHandler(db))
	wa.POST("/merchant-message", merchantMessageHandler(db))
}

func RegisterPaystack(r *gin.RouterGroup, db *sql.DB) {
	r.POST("/webhooks/paystack/:merchantId", paystackWebhookHandler(db))
	r.POST("/webhooks/paystack/platform", platformPaystackHandler(db))
}

func RegisterMoolre(r *gin.RouterGroup, db *sql.DB) {
	r.POST("/webhooks/moolre", moolrePaymentHandler(db))
}

func RegisterAll(r *gin.Engine, db *sql.DB) {
	r.POST("/webhooks/message", messageHandler(db))
	r.POST("/webhooks/status", statusHandler(db))
	r.POST("/webhooks/startup", startupHandler(db))
	r.POST("/webhooks/reachout", reachoutHandler(db))
	r.GET("/webhooks/reachout", reachoutGetHandler(db))
	r.POST("/webhooks/merchant-message", merchantMessageHandler(db))
	r.POST("/webhooks/paystack/:merchantId", paystackWebhookHandler(db))
	r.POST("/webhooks/paystack/platform", platformPaystackHandler(db))
	r.POST("/webhooks/moolre", moolrePaymentHandler(db))
}

func paystackWebhookHandler(db *sql.DB) gin.HandlerFunc {
	return paystackWebhook(db)
}

func moolrePaymentHandler(db *sql.DB) gin.HandlerFunc {
	return moolrePaymentWebhook(db)
}

func generateUUID() string {
	return uuid.New().String()
}
