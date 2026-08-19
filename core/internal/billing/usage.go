package billing

import (
	"database/sql"
)

type UsageTracker struct {
	db *sql.DB
}

func NewUsageTracker(db *sql.DB) *UsageTracker {
	return &UsageTracker{db: db}
}

type UsageRecord struct {
	MerchantID string `json:"merchantId"`
	Plan       string `json:"plan"`
	Messages   int    `json:"messages"`
	Inventory  int    `json:"inventory"`
}

func (t *UsageTracker) GetUsage(merchantID string) (*UsageRecord, error) {
	var usage UsageRecord
	usage.MerchantID = merchantID

	_ = t.db.QueryRow("SELECT COALESCE(plan, 'trial') FROM merchants WHERE id = $1", merchantID).Scan(&usage.Plan)

	_ = t.db.QueryRow("SELECT COUNT(*)::int FROM inventory WHERE merchant_id = $1 AND active = true", merchantID).Scan(&usage.Inventory)

	_ = t.db.QueryRow(`SELECT COUNT(*)::int FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		WHERE c.merchant_id = $1 AND m.sender = 'bot' AND m.created_at >= NOW() - INTERVAL '24 hours'`, merchantID).Scan(&usage.Messages)

	return &usage, nil
}
