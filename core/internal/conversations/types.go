package conversations

import (
	"time"
)

type Conversation struct {
	ID           string    `json:"id"`
	MerchantID   string    `json:"merchantId"`
	CustomerPhone string  `json:"customerPhone"`
	Status       string    `json:"status"`
	State        string    `json:"state"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type IntentRecord struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	Intent         string    `json:"intent"`
	Text           string    `json:"text"`
	Confidence     float64   `json:"confidence"`
	State          string    `json:"state"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
}

type IntentRow struct {
	Intent    string  `json:"intent"`
	Confidence float64 `json:"confidence"`
}

type OrderSummary struct {
	OrderID   string `json:"orderId"`
	Status    string `json:"status"`
	Total     int    `json:"total"`
ItemCount  int    `json:"itemCount"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	Sender         string    `json:"sender"`
	Body           string    `json:"body"`
	CreatedAt      time.Time `json:"createdAt"`
}

type ConversationWithMessages struct {
	Conversation
	Messages []Message `json:"messages"`
}
