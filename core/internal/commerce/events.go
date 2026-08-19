package commerce

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID         string    `json:"id"`
	MerchantID string    `json:"merchantId"`
	Type       string    `json:"type"`
	Payload    string    `json:"payload"`
	CreatedAt  time.Time `json:"createdAt"`
}

func EmitEvent(db *sql.DB, merchantID, eventType, payload string) (string, error) {
	id := uuid.New().String()
	_, err := db.Exec(`INSERT INTO merchant_events (id, merchant_id, type, payload, created_at)
		VALUES ($1, $2, $3, $4, NOW())`, id, merchantID, eventType, payload)
	if err != nil {
		fmt.Printf("commerce: failed to emit event (type=%s merchant=%s): %v\n", eventType, merchantID, err)
		return "", err
	}
	return id, nil
}
