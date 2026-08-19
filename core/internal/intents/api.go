package intents

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IntentType string

type ConversationState string

type ConversationStatus string

const (
	StateIdle           ConversationState = "idle"
	StateBrowsing       ConversationState = "browsing"
	StateOrdering       ConversationState = "ordering"
	StateConfirming     ConversationState = "confirming"
	StatePaymentPending ConversationState = "payment_pending"
	StateEscalated      ConversationState = "escalated"
	StateClosed         ConversationState = "closed"
)

const (
	StatusActive          ConversationStatus = "ACTIVE"
	StatusWaitingMerchant ConversationStatus = "WAITING_MERCHANT"
	StatusMerchantEngaged ConversationStatus = "MERCHANT_ENGAGED"
	StatusResolved        ConversationStatus = "RESOLVED"
)

type IntentResult struct {
	Intent           string            `json:"intent"`
	Confidence       float64           `json:"confidence"`
	State            ConversationState `json:"state"`
	Status           ConversationStatus `json:"status"`
	ViolationType    string            `json:"violationType"`
	ViolationDetails string            `json:"violationDetails"`
}

func ClassifyIntent(db *sql.DB, merchantID, conversationID, text string) (*IntentResult, error) {
	classified := Classify(text)

	result := &IntentResult{
		Intent:     classified,
		Confidence: 0.8,
		State:      StateBrowsing,
		Status:     StatusActive,
	}

	if LooksLikePromptInjection(text) {
		result.Intent = IntentPromptInjection
		result.ViolationType = "prompt_injection"
		result.ViolationDetails = text
		result.Confidence = 1.0
		return result, nil
	}

	switch result.Intent {
	case "greeting":
		result.State = StateIdle
	case IntentBrowseCategory:
		result.State = StateBrowsing
	case IntentOrder, IntentProceedToOrder:
		result.State = StateOrdering
	case IntentCheckoutConfirm:
		result.State = StateConfirming
	case IntentPaymentFollowup:
		result.State = StatePaymentPending
	case IntentRequestedHuman:
		result.State = StateEscalated
		result.Status = StatusWaitingMerchant
	case IntentOrderCorrection:
		result.State = StateOrdering
	case IntentPriceNegotiation:
		result.State = StateBrowsing
	case IntentGroundingViolation:
		result.State = StateBrowsing
		result.Status = StatusActive
	}

	if result.State == StateEscalated {
		result.Status = StatusWaitingMerchant
	}

	id := uuid.New().String()
	_, _ = db.Exec(`INSERT INTO conversation_intents (id, conversation_id, merchant_id, intent, text, confidence, state, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		id, conversationID, merchantID, result.Intent, text, result.Confidence, result.State, result.Status, time.Now())

	return result, nil
}

func HandleIntent(db *sql.DB, merchantID, conversationID, text string) (*IntentResult, error) {
	return ClassifyIntent(db, merchantID, conversationID, text)
}

func IntentHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			ConversationID string `json:"conversationId" binding:"required"`
			Text           string `json:"text" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		result, err := ClassifyIntent(db, merchantID, req.ConversationID, req.Text)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to classify intent"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": result})
	}
}
