package commerce

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	Sender         string    `json:"sender"`
	Body           string    `json:"body"`
	CreatedAt      time.Time `json:"createdAt"`
}

func SaveMessage(db *sql.DB, conversationID, sender, body string) error {
	id := uuid.New().String()
	_, err := db.Exec(`INSERT INTO messages (id, conversation_id, sender, body, created_at)
		VALUES ($1, $2, $3, $4, NOW())`, id, conversationID, sender, body)
	if err != nil {
		fmt.Printf("commerce: failed to save message conversation=%s: %v\n", conversationID, err)
	}
	return err
}

func GetLastMessage(db *sql.DB, conversationID string) (string, error) {
	var body string
	err := db.QueryRow("SELECT body FROM messages m WHERE m.conversation_id = $1 ORDER BY m.created_at DESC LIMIT 1", conversationID).Scan(&body)
	if err != nil {
		return "", err
	}
	return body, nil
}

func GetMessages(db *sql.DB, conversationID string) ([]Message, error) {
	rows, err := db.Query("SELECT id, conversation_id, sender, body, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var messages []Message
	for rows.Next() {
		var m Message
		_ = rows.Scan(&m.ID, &m.ConversationID, &m.Sender, &m.Body, &m.CreatedAt)
		messages = append(messages, m)
	}
	return messages, nil
}
