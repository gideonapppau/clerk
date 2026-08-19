package push

import (
	"database/sql"
	"fmt"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/google/uuid"
)

type Service struct {
	db            *sql.DB
	vapidPrivate  string
	vapidPublic   string
}

func NewService(db *sql.DB, vapidPrivate, vapidPublic string) *Service {
	return &Service{
		db:           db,
		vapidPrivate: vapidPrivate,
		vapidPublic:  vapidPublic,
	}
}

type PushSubscription struct {
	Endpoint string `json:"endpoint"`
	P256dh   string `json:"p256dh"`
	Auth     string `json:"auth"`
}

func (s *Service) IsConfigured() bool {
	return s.vapidPrivate != "" && s.vapidPublic != ""
}

func (s *Service) VAPIDPublicKey() string {
	return s.vapidPublic
}

func (s *Service) Subscribe(merchantID, endpoint, p256dh, auth string) error {
	_, err := s.db.Exec(`INSERT INTO merchant_push_subscriptions (id, merchant_id, endpoint, p256dh, auth, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT DO NOTHING`,
		generateID(), merchantID, endpoint, p256dh, auth)
	return err
}

func (s *Service) Unsubscribe(merchantID, endpoint string) error {
	_, err := s.db.Exec("DELETE FROM merchant_push_subscriptions WHERE merchant_id = $1 AND endpoint = $2", merchantID, endpoint)
	return err
}

func (s *Service) IsSubscribed(merchantID string) (bool, error) {
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchant_push_subscriptions WHERE merchant_id = $1)", merchantID).Scan(&exists)
	return exists, err
}

func (s *Service) SendNotification(merchantID, title, body string) (int, error) {
	if !s.IsConfigured() {
		return 0, fmt.Errorf("push notifications are not configured on this server")
	}

	rows, err := s.db.Query("SELECT endpoint, p256dh, auth FROM merchant_push_subscriptions WHERE merchant_id = $1", merchantID)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	sent := 0
	for rows.Next() {
		var sub PushSubscription
		_ = rows.Scan(&sub.Endpoint, &sub.P256dh, &sub.Auth)

		webpushSub := &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.P256dh,
				Auth:   sub.Auth,
			},
		}

		resp, err := webpush.SendNotification([]byte(fmt.Sprintf(`{"title":"%s","body":"%s"}`, title, body)), webpushSub, &webpush.Options{
			VAPIDPrivateKey: s.vapidPrivate,
			VAPIDPublicKey:  s.vapidPublic,
			TTL:             60,
		})
		if err != nil {
			fmt.Printf("push: send failed merchant=%s status=%d endpoint=%s err=%v\n", merchantID, 0, sub.Endpoint, err)
			continue
		}
		defer resp.Body.Close()
		if resp.StatusCode == 201 || resp.StatusCode == 200 {
			sent++
		}
	}

	return sent, nil
}

func (s *Service) SendTest(merchantID string) (int, error) {
	return s.SendNotification(merchantID, "Test Notification", "This is a test push notification from Clerk.")
}

func (s *Service) GetSubscriptions(merchantID string) ([]PushSubscription, error) {
	rows, err := s.db.Query("SELECT endpoint, p256dh, auth FROM merchant_push_subscriptions WHERE merchant_id = $1", merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var subs []PushSubscription
	for rows.Next() {
		var sub PushSubscription
		_ = rows.Scan(&sub.Endpoint, &sub.P256dh, &sub.Auth)
		subs = append(subs, sub)
	}
	return subs, nil
}

func generateID() string {
	return uuid.New().String()
}
