package v1

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/clerk/core/internal/api"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func pushConfigHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		vapidPublic := os.Getenv("VAPID_PUBLIC_KEY")
		supported := vapidPublic != ""
		api.OK(c, gin.H{
			"vapidPublicKey": vapidPublic,
			"supported":      supported,
		})
	}
}

func pushStatusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var exists bool
		_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchant_push_subscriptions WHERE merchant_id = $1)", merchantID).Scan(&exists)
		var count int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchant_push_subscriptions WHERE merchant_id = $1", merchantID).Scan(&count)

		api.OK(c, gin.H{
			"subscribed": exists,
			"count":      count,
		})
	}
}

func pushSubscribeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Endpoint  string `json:"endpoint" binding:"required"`
			P256dh    string `json:"p256dh" binding:"required"`
			Auth      string `json:"auth" binding:"required"`
			UserAgent string `json:"userAgent"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		id := uuid.New().String()
		_, err := db.Exec(`INSERT INTO merchant_push_subscriptions (id, merchant_id, endpoint, p256dh, auth, user_agent, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT (merchant_id, endpoint) DO UPDATE SET
			p256dh = $4, auth = $5, user_agent = $6, updated_at = NOW()`,
			id, merchantID, req.Endpoint, req.P256dh, req.Auth, req.UserAgent)
		if err != nil {
			api.InternalError(c, "failed to save subscription")
			return
		}
		api.OK(c, gin.H{"status": "subscribed"})
	}
}

func pushUnsubscribeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Endpoint string `json:"endpoint"`
		}
		_ = c.ShouldBindJSON(&req)

		if req.Endpoint != "" {
			_, _ = db.Exec("DELETE FROM merchant_push_subscriptions WHERE merchant_id = $1 AND endpoint = $2", merchantID, req.Endpoint)
		} else {
			_, _ = db.Exec("DELETE FROM merchant_push_subscriptions WHERE merchant_id = $1", merchantID)
		}
		api.OK(c, gin.H{"status": "unsubscribed"})
	}
}

func pushTestHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		vapidPrivate := os.Getenv("VAPID_PRIVATE_KEY")
		vapidPublic := os.Getenv("VAPID_PUBLIC_KEY")
		if vapidPrivate == "" || vapidPublic == "" {
			api.Error(c, http.StatusServiceUnavailable, "push notifications are not configured on this server")
			return
		}

		rows, err := db.Query("SELECT endpoint, p256dh, auth FROM merchant_push_subscriptions WHERE merchant_id = $1", merchantID)
		if err != nil {
			api.InternalError(c, "failed to load subscriptions")
			return
		}
		defer rows.Close()

		sent := 0
		failed := 0
		for rows.Next() {
			var endpoint, p256dh, auth string
			if err := rows.Scan(&endpoint, &p256dh, &auth); err != nil {
				failed++
				continue
			}
			sub := &webpush.Subscription{
				Endpoint: endpoint,
				Keys: webpush.Keys{
					P256dh: p256dh,
					Auth:   auth,
				},
			}
			payload := fmt.Sprintf(`{"title":"Test Notification","body":"This is a test push notification from Clerk.","merchantId":"%s"}`, merchantID)
			resp, err := webpush.SendNotification([]byte(payload), sub, &webpush.Options{
				VAPIDPrivateKey: vapidPrivate,
				VAPIDPublicKey:  vapidPublic,
				TTL:             60,
			})
			if err != nil {
				failed++
				continue
			}
			resp.Body.Close()
			if resp.StatusCode == 201 || resp.StatusCode == 200 {
				sent++
			} else {
				failed++
			}
		}
		api.OK(c, gin.H{"sent": sent, "failed": failed})
	}
}

func sessionConnectHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			SessionID   string `json:"sessionId"`
			From        string `json:"from"`
			Text        string `json:"text"`
			MessageKind string `json:"messageKind"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}
		api.OK(c, gin.H{
			"sessionId": req.SessionID,
			"connected": false,
			"release":   false,
		})
	}
}
