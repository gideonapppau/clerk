package reliability

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Bucket struct {
	Type         string    `json:"type"`
	MerchantID   string    `json:"merchantId"`
	ConversationID string  `json:"conversationId"`
	MessageID    string    `json:"messageId"`
	Details      string    `json:"details"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Capture(b *Bucket) error {
	if b.Type == "" {
		return fmt.Errorf("reliability: type is required")
	}
	id := uuid.New().String()
	_, err := r.db.Exec(`INSERT INTO reliability_events (id, type, merchant_id, conversation_id, message_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
		id, b.Type, b.MerchantID, b.ConversationID, b.MessageID, b.Details)
	if err != nil {
		fmt.Printf("reliability: capture failed (type=%s merchant=%s conversation=%s message=%s): %v\n",
			b.Type, b.MerchantID, b.ConversationID, b.MessageID, err)
	}
	return err
}

func (r *Repository) GetByType(merchantID, eventType string, limit int) ([]Bucket, error) {
	rows, err := r.db.Query(`SELECT id, type, merchant_id, conversation_id, message_id, details, created_at
		FROM reliability_events WHERE merchant_id = $1 AND type = $2
		ORDER BY created_at DESC LIMIT $3`, merchantID, eventType, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var buckets []Bucket
	for rows.Next() {
		var b Bucket
		var id string
		_ = rows.Scan(&id, &b.Type, &b.MerchantID, &b.ConversationID, &b.MessageID, &b.Details, &b.CreatedAt)
		buckets = append(buckets, b)
	}
	return buckets, nil
}
