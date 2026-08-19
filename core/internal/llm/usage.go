package llm

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type UsageTracker struct {
	db *sql.DB
}

func NewUsageTracker(db *sql.DB) *UsageTracker {
	return &UsageTracker{db: db}
}

type LLMUsageRecord struct {
	ID               string    `json:"id"`
	MerchantID       string    `json:"merchantId"`
	ConversationID   string    `json:"conversationId"`
	Model            string    `json:"model"`
	PromptTokens     int       `json:"promptTokens"`
	CompletionTokens int       `json:"completionTokens"`
	TotalTokens      int       `json:"totalTokens"`
	CreatedAt        time.Time `json:"createdAt"`
}

func LogUsage(db *sql.DB, merchantID, model string, promptTokens, completionTokens, totalTokens int) {
	id := uuid.New().String()
	_, _ = db.Exec(`INSERT INTO llm_usage (id, merchant_id, model, prompt_tokens, completion_tokens, total_tokens, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
		id, merchantID, model, promptTokens, completionTokens, totalTokens)
}

func (t *UsageTracker) Record(merchantID, conversationID, model string, usage Usage) error {
	id := uuid.New().String()
	_, err := t.db.Exec(`INSERT INTO llm_usage (id, merchant_id, conversation_id, model, prompt_tokens, completion_tokens, total_tokens, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
		id, merchantID, conversationID, model, usage.PromptTokens, usage.CompletionTokens, usage.TotalTokens)
	return err
}

func (t *UsageTracker) GetTotalTokens(merchantID string) (int, error) {
	var total int
	err := t.db.QueryRow("SELECT COALESCE(SUM(total_tokens), 0) FROM llm_usage WHERE merchant_id = $1", merchantID).Scan(&total)
	return total, err
}
