package conversations

import (
	"database/sql"
	"time"
)

type Ownership struct {
	ConversationID string    `json:"conversationId"`
	MerchantID     string    `json:"merchantId"`
	AssignedTo     string    `json:"assignedTo"`
	AssignedAt     time.Time `json:"assignedAt"`
}

func AssignConversation(db *sql.DB, conversationID, merchantID string) error {
	_, err := db.Exec(`UPDATE conversations SET status = 'WAITING_MERCHANT', updated_at = NOW() WHERE id = $1 AND merchant_id = $2`, conversationID, merchantID)
	return err
}

func TakeoverConversation(db *sql.DB, conversationID, merchantID string) error {
	_, err := db.Exec(`UPDATE conversations SET status = 'MERCHANT_ENGAGED', updated_at = NOW() WHERE id = $1 AND merchant_id = $2`, conversationID, merchantID)
	return err
}

func ReleaseConversation(db *sql.DB, conversationID string) error {
	_, err := db.Exec(`UPDATE conversations SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`, conversationID)
	return err
}
