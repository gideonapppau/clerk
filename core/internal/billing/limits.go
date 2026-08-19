package billing

import (
	"database/sql"
)

type Limits struct {
	MaxInventory      int
	MaxMessagesPerDay int
	MaxConversations   int
	Features          []string
}

var planLimits = map[string]Limits{
	"trial": {
		MaxInventory:      20,
		MaxMessagesPerDay: 50,
		MaxConversations:   50,
		Features:          []string{"basic"},
	},
	"starter": {
		MaxInventory:      100,
		MaxMessagesPerDay: 200,
		MaxConversations:   200,
		Features:          []string{"basic", "payments", "analytics"},
	},
	"growth": {
		MaxInventory:      500,
		MaxMessagesPerDay: 1000,
		MaxConversations:   1000,
		Features:          []string{"basic", "payments", "analytics", "priority"},
	},
}

func GetLimits(plan string) Limits {
	if limits, ok := planLimits[plan]; ok {
		return limits
	}
	return planLimits["trial"]
}

func CheckInventoryLimit(db *sql.DB, merchantID string) (bool, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*)::int FROM inventory WHERE merchant_id = $1 AND active = true", merchantID).Scan(&count)
	if err != nil {
		return false, err
	}
	var plan string
	_ = db.QueryRow("SELECT COALESCE(plan, 'trial') FROM merchants WHERE id = $1", merchantID).Scan(&plan)
	limits := GetLimits(plan)
	return count < limits.MaxInventory, nil
}

func CheckMessageLimit(db *sql.DB, merchantID string) (bool, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*)::int FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		WHERE c.merchant_id = $1 AND m.sender = 'bot' AND m.created_at >= NOW() - INTERVAL '24 hours'`, merchantID).Scan(&count)
	if err != nil {
		return false, err
	}
	var plan string
	_ = db.QueryRow("SELECT COALESCE(plan, 'trial') FROM merchants WHERE id = $1", merchantID).Scan(&plan)
	limits := GetLimits(plan)
	return count < limits.MaxMessagesPerDay, nil
}
