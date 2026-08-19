package v1

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/clerk/core/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func checkoutCompleteHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			OrderID        string `json:"orderId" binding:"required"`
			ConversationID string `json:"conversationId"`
			CustomerID     string `json:"customerId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		var ownerID, status, currentRef string
		var total int
		err := db.QueryRow("SELECT merchant_id, status, total, COALESCE(payment_reference, '') FROM orders WHERE id = $1", req.OrderID).
			Scan(&ownerID, &status, &total, &currentRef)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		if status == "CONFIRMED" {
			api.OK(c, gin.H{"status": "already_paid", "orderId": req.OrderID})
			return
		}

		var provider, phone, paystackKey, moolrePriv, moolrePub string
		_ = db.QueryRow("SELECT type, details FROM merchant_payment_methods WHERE merchant_id = $1 AND is_default = true LIMIT 1", merchantID).
			Scan(&provider, &phone)
		if provider == "" {
			_ = db.QueryRow("SELECT type, details FROM merchant_payment_methods WHERE merchant_id = $1 LIMIT 1", merchantID).
				Scan(&provider, &phone)
		}

		_ = db.QueryRow("SELECT details FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'paystack'", merchantID).
			Scan(&paystackKey)
		_ = db.QueryRow("SELECT details FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'moolre'", merchantID).
			Scan(&moolrePriv)

		moolrePub = os.Getenv("MOOLRE_PUBLIC_KEY")

		reference := fmt.Sprintf("clrk-%s", uuid.New().String()[:8])
		checkoutURL := ""

		switch provider {
		case "paystack":
			if paystackKey != "" {
				checkoutURL = fmt.Sprintf("https://checkout.paystack.com/%s", reference)
				_, _ = db.Exec("UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, updated_at = NOW() WHERE id = $3", reference, checkoutURL, req.OrderID)
			}
		case "moolre":
			if moolrePriv != "" && moolrePub != "" {
				checkoutURL = fmt.Sprintf("https://sandbox.moolre.com/checkout/%s", reference)
				_, _ = db.Exec("UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, updated_at = NOW() WHERE id = $3", reference, checkoutURL, req.OrderID)
			}
		default:
			if !shouldFallbackToManualCheckout(db, merchantID) {
				checkoutURL = fmt.Sprintf("%s/checkout/%s", os.Getenv("APP_URL"), req.OrderID)
				_, _ = db.Exec("UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, updated_at = NOW() WHERE id = $3", reference, checkoutURL, req.OrderID)
			}
		}

		if checkoutURL == "" {
			checkoutURL = fmt.Sprintf("%s/checkout/%s", os.Getenv("APP_URL"), req.OrderID)
			_, _ = db.Exec("UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, updated_at = NOW() WHERE id = $3", reference, checkoutURL, req.OrderID)
		}

		api.OK(c, gin.H{
			"status":      "checkout_ready",
			"orderId":     req.OrderID,
			"checkoutUrl": checkoutURL,
			"reference":   reference,
			"amount":      total,
			"provider":    provider,
		})
	}
}

func initiatePaymentHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			OrderID string `json:"orderId" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		var ownerID, status string
		var total int
		err := db.QueryRow("SELECT merchant_id, status, total FROM orders WHERE id = $1", req.OrderID).
			Scan(&ownerID, &status, &total)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		if status == "CONFIRMED" {
			api.OK(c, gin.H{"status": "already_paid"})
			return
		}

		var provider, details string
		err = db.QueryRow("SELECT type, details FROM merchant_payment_methods WHERE merchant_id = $1 AND is_default = true LIMIT 1", merchantID).
			Scan(&provider, &details)
		if err != nil {
			err = db.QueryRow("SELECT type, details FROM merchant_payment_methods WHERE merchant_id = $1 LIMIT 1", merchantID).
				Scan(&provider, &details)
			if err != nil {
				api.BadRequest(c, "no payment method configured")
				return
			}
		}

		reference := fmt.Sprintf("clrk-%s", uuid.New().String()[:8])
		var checkoutURL string

		switch provider {
		case "paystack":
			checkoutURL = fmt.Sprintf("https://checkout.paystack.com/%s", reference)
		case "moolre":
			checkoutURL = fmt.Sprintf("https://sandbox.moolre.com/checkout/%s", reference)
		case "momo":
			checkoutURL = ""
		default:
			checkoutURL = fmt.Sprintf("%s/checkout/%s", os.Getenv("APP_URL"), req.OrderID)
		}

		_, _ = db.Exec("UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, updated_at = NOW() WHERE id = $3", reference, checkoutURL, req.OrderID)

		api.OK(c, gin.H{
			"status":      "initiated",
			"orderId":     req.OrderID,
			"reference":   reference,
			"checkoutUrl": checkoutURL,
			"provider":    provider,
			"amount":      total,
		})
	}
}

func issueCheckoutTokenHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			OrderID    string `json:"orderId" binding:"required"`
			MerchantID string `json:"merchantId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		var ownerID string
		err := db.QueryRow("SELECT merchant_id FROM orders WHERE id = $1", req.OrderID).Scan(&ownerID)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		token, err := auth.SignToken(merchantID)
		if err != nil {
			api.InternalError(c, "failed to issue token")
			return
		}

		_, _ = db.Exec("UPDATE orders SET updated_at = NOW() WHERE id = $1", req.OrderID)

		api.OK(c, gin.H{
			"token":   token,
			"orderId": req.OrderID,
			"expires": time.Now().Add(15 * time.Minute).Unix(),
		})
	}
}

func verifyCheckoutTokenHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Token string `json:"token" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		merchantID, err := auth.ParseToken(req.Token)
		if err != nil {
			api.OK(c, gin.H{"valid": false, "error": "invalid token"})
			return
		}

		var exists bool
		_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchants WHERE id = $1)", merchantID).Scan(&exists)

		api.OK(c, gin.H{
			"valid":      exists,
			"merchantId": merchantID,
		})
	}
}

func resolveCheckoutHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			OrderID string `json:"orderId" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		var ownerID, status, paymentRef string
		err := db.QueryRow("SELECT merchant_id, status, COALESCE(payment_reference, '') FROM orders WHERE id = $1", req.OrderID).
			Scan(&ownerID, &status, &paymentRef)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		if status == "CONFIRMED" {
			api.OK(c, gin.H{"status": "paid", "orderId": req.OrderID})
			return
		}

		if paymentRef != "" {
			var orderStatus string
			err = db.QueryRow("SELECT status FROM orders WHERE payment_reference = $1", paymentRef).Scan(&orderStatus)
			if err == nil && orderStatus == "CONFIRMED" {
				api.OK(c, gin.H{"status": "paid", "orderId": req.OrderID})
				return
			}
		}

		api.OK(c, gin.H{"status": status, "orderId": req.OrderID})
	}
}

func shouldFallbackToManualCheckout(db *sql.DB, merchantID string) bool {
	var count int
	_ = db.QueryRow("SELECT COUNT(*)::int FROM merchant_payment_methods WHERE merchant_id = $1", merchantID).Scan(&count)
	return count > 0
}
