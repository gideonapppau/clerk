package v1

import (
	"database/sql"
	"net/http"

	"github.com/clerk/core/internal/api"
	"github.com/clerk/core/internal/conversations"
	"github.com/gin-gonic/gin"
)

var limiter = api.DefaultSimulateLimiter()

func simulateHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			MerchantID    string `json:"merchantId" binding:"required"`
			CustomerPhone string `json:"customerPhone" binding:"required"`
			Text          string `json:"text" binding:"required"`
			MessageKind   string `json:"messageKind"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		if req.Text == "" {
			api.BadRequest(c, "text is required")
			return
		}

		merchantID := req.MerchantID
		if merchantID == "" {
			merchantID = c.GetString("merchantId")
		}
		if merchantID == "" {
			api.BadRequest(c, "merchantId is required")
			return
		}

		if !limiter.Allow(merchantID) {
			api.Error(c, http.StatusTooManyRequests, "rate limit exceeded, try again later")
			return
		}

		phone := req.CustomerPhone
		if phone == "" {
			phone = "+1000000000"
		}

		manager := conversations.NewManager(db)
		result, err := manager.SimulateMessage(merchantID, phone, req.Text)
		if err != nil {
			api.InternalError(c, "failed to simulate message")
			return
		}

		api.OK(c, gin.H{
			"status":         "simulated",
			"reply":          result.Reply,
			"conversationId": result.ConversationID,
			"state":          result.State,
			"orderId":        result.OrderID,
			"paymentUrl":     result.PaymentURL,
			"needsEscalation": result.NeedsEscalation,
			"takeover":       result.Takeover,
		})
	}
}
