package v1

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/gin-gonic/gin"
)

func billingStatusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var plan string
		var createdAt time.Time
		err := db.QueryRow("SELECT COALESCE(plan, 'trial'), created_at FROM merchants WHERE id = $1", merchantID).Scan(&plan, &createdAt)
		if err != nil {
			api.InternalError(c, "failed to get billing status")
			return
		}

		var inventoryCount, messageCount, conversationCount int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM inventory WHERE merchant_id = $1 AND active = true", merchantID).Scan(&inventoryCount)
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM messages m
			JOIN conversations c ON m.conversation_id = c.id
			WHERE c.merchant_id = $1 AND m.sender = 'clerk' AND m.created_at >= NOW() - INTERVAL '24 hours'`, merchantID).Scan(&messageCount)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM conversations WHERE merchant_id = $1", merchantID).Scan(&conversationCount)

		var totalOrders, paidOrders int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM orders WHERE merchant_id = $1", merchantID).Scan(&totalOrders)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM orders WHERE merchant_id = $1 AND paid_at IS NOT NULL", merchantID).Scan(&paidOrders)

		limits := getPlanLimits(plan)

		api.OK(c, gin.H{
			"plan":          plan,
			"createdAt":     createdAt,
			"limits":        limits,
			"usage": gin.H{
				"inventory":     inventoryCount,
				"messages24h":   messageCount,
				"conversations": conversationCount,
				"totalOrders":   totalOrders,
				"paidOrders":    paidOrders,
			},
		})
	}
}

func billingCheckoutHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Plan  string `json:"plan" binding:"required"`
			Email string `json:"email"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		validPlans := map[string]bool{"trial": true, "starter": true, "growth": true}
		if !validPlans[req.Plan] {
			api.BadRequest(c, "invalid plan")
			return
		}

		var currentPlan string
		_ = db.QueryRow("SELECT COALESCE(plan, 'trial') FROM merchants WHERE id = $1", merchantID).Scan(&currentPlan)
		if currentPlan == req.Plan {
			api.BadRequest(c, "already on this plan")
			return
		}

		planPrices := map[string]int{"trial": 0, "starter": 50, "growth": 150}
		price := planPrices[req.Plan]

		if price == 0 {
			_, err := db.Exec("UPDATE merchants SET plan = $1, updated_at = NOW() WHERE id = $2", req.Plan, merchantID)
			if err != nil {
				api.InternalError(c, "failed to update plan")
				return
			}
			api.OK(c, gin.H{"status": "activated", "plan": req.Plan})
			return
		}

		var email, name string
		if req.Email != "" {
			email = req.Email
		} else {
			_ = db.QueryRow("SELECT COALESCE(name, ''), COALESCE(phone, '') FROM merchants WHERE id = $1", merchantID).Scan(&name, &email)
		}

		paystackKey := os.Getenv("PAYSTACK_SECRET_KEY")
		reference := fmt.Sprintf("clrk-sub-%s-%d", merchantID[:8], time.Now().Unix())

		var checkoutURL string
		if paystackKey != "" {
			checkoutURL = fmt.Sprintf("https://checkout.paystack.com/%s", reference)
		} else {
			checkoutURL = fmt.Sprintf("%s/billing/checkout?reference=%s&plan=%s", os.Getenv("APP_URL"), reference, req.Plan)
		}

		_, _ = db.Exec(`INSERT INTO merchant_billing (id, merchant_id, plan, amount, reference, status, created_at)
			VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
			reference, merchantID, req.Plan, price*100, reference)

		api.OK(c, gin.H{
			"status":      "checkout_initiated",
			"plan":        req.Plan,
			"amount":      price,
			"reference":   reference,
			"checkoutUrl": checkoutURL,
		})
	}
}

func billingVerifyHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Reference string `json:"reference" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		var billingID, plan, status string
		var amount int
		err := db.QueryRow(`SELECT id, plan, amount, status FROM merchant_billing
			WHERE reference = $1 AND merchant_id = $2`, req.Reference, merchantID).
			Scan(&billingID, &plan, &amount, &status)
		if err != nil {
			api.NotFound(c, "billing record not found")
			return
		}

		if status == "verified" || status == "completed" {
			api.OK(c, gin.H{"status": "already_verified", "plan": plan})
			return
		}

		var paystackRef string
		_ = db.QueryRow("SELECT COALESCE(payment_reference, '') FROM orders WHERE payment_reference = $1", req.Reference).Scan(&paystackRef)

		_, _ = db.Exec("UPDATE merchants SET plan = $1, updated_at = NOW() WHERE id = $2", plan, merchantID)
		_, _ = db.Exec("UPDATE merchant_billing SET status = 'verified', verified_at = NOW() WHERE id = $1", billingID)

		api.OK(c, gin.H{"status": "verified", "plan": plan})
	}
}

func billingCancelHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")

		var currentPlan string
		_ = db.QueryRow("SELECT COALESCE(plan, 'trial') FROM merchants WHERE id = $1", merchantID).Scan(&currentPlan)

		_, err := db.Exec("UPDATE merchants SET plan = 'trial', updated_at = NOW() WHERE id = $1", merchantID)
		if err != nil {
			api.InternalError(c, "failed to cancel subscription")
			return
		}

		_, _ = db.Exec(`UPDATE merchant_billing SET status = 'cancelled', cancelled_at = NOW()
			WHERE merchant_id = $1 AND status IN ('verified', 'completed')`, merchantID)

		api.OK(c, gin.H{
			"status":        "cancelled",
			"previousPlan":  currentPlan,
			"currentPlan":   "trial",
		})
	}
}

func getPlanLimits(plan string) gin.H {
	switch plan {
	case "growth":
		return gin.H{"maxInventory": 500, "maxMessagesPerDay": 1000, "maxConversations": 1000}
	case "starter":
		return gin.H{"maxInventory": 100, "maxMessagesPerDay": 200, "maxConversations": 200}
	default:
		return gin.H{"maxInventory": 20, "maxMessagesPerDay": 50, "maxConversations": 50}
	}
}
