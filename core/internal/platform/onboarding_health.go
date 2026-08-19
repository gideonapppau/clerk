package platform

import (
	"database/sql"
)

type OnboardingHealth struct {
	TotalMerchants   int `json:"totalMerchants"`
	ConnectedMerchants int `json:"connectedMerchants"`
	WithInventory    int `json:"withInventory"`
	WithFirstMessage int `json:"withFirstMessage"`
	WithFirstOrder   int `json:"withFirstOrder"`
}

func GetOnboardingHealth(db *sql.DB) (*OnboardingHealth, error) {
	h := &OnboardingHealth{}
	_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&h.TotalMerchants)
	_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE connected = true").Scan(&h.ConnectedMerchants)
	_ = db.QueryRow(`SELECT COUNT(DISTINCT merchant_id)::int FROM inventory WHERE active = true`).Scan(&h.WithInventory)
	_ = db.QueryRow(`SELECT COUNT(DISTINCT c.merchant_id)::int FROM conversations c
		JOIN messages m ON m.conversation_id = c.id`).Scan(&h.WithFirstMessage)
	_ = db.QueryRow(`SELECT COUNT(DISTINCT merchant_id)::int FROM orders WHERE paid_at IS NOT NULL`).Scan(&h.WithFirstOrder)
	return h, nil
}
