package notify

import (
	"database/sql"
	"fmt"
	"sync"
	"time"
)

type SMSAlert struct {
	Phone   string
	Message string
}

type Service struct {
	db        *sql.DB
	rateLimit map[string]time.Time
	mu        sync.Mutex
}

func NewService(db *sql.DB) *Service {
	return &Service{
		db:        db,
		rateLimit: make(map[string]time.Time),
	}
}

func (s *Service) SendSMS(phone, message string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := phone + ":" + message[:min(20, len(message))]
	if last, ok := s.rateLimit[key]; ok && time.Since(last) < 5*time.Minute {
		return nil
	}
	s.rateLimit[key] = time.Now()

	fmt.Printf("sms: to=%s msg=%s\n", phone, message)
	return nil
}

func (s *Service) SendAlert(phone, message string) error {
	return s.SendSMS(phone, message)
}

func (s *Service) AlertEscalation(merchantPhone, reason string) error {
	var msg string
	switch reason {
	case "frustration":
		msg = "A customer seems frustrated on WhatsApp."
	case "order_failed":
		msg = "A customer order could not be completed."
	default:
		msg = "Clerk: A customer on WhatsApp asked to speak with you. Open your Clerk dashboard to reply."
	}
	return s.SendSMS(merchantPhone, msg)
}

func (s *Service) AlertNegotiation(merchantPhone string) error {
	return s.SendSMS(merchantPhone, "Clerk: A customer wants to negotiate price on WhatsApp. Check your Clerk dashboard.")
}

func (s *Service) AlertLimitReached(merchantPhone string) error {
	return s.SendSMS(merchantPhone, "Clerk: Your automated reply limit was reached. Upgrade in the dashboard or reply on WhatsApp.")
}

func (s *Service) AlertCustomerOrderFailed(merchantPhone string) error {
	return s.SendSMS(merchantPhone, "A customer order could not be completed.")
}

func (s *Service) AlertHumanRequested(merchantPhone string) error {
	return s.SendSMS(merchantPhone, "Clerk: A customer on WhatsApp asked to speak with you. Open your Clerk dashboard to reply.")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
