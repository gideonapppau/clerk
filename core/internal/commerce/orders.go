package commerce

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Order struct {
	ID             string    `json:"id"`
	MerchantID     string    `json:"merchantId"`
	ConversationID string    `json:"conversationId"`
	CustomerPhone  string    `json:"customerPhone"`
	Status         string    `json:"status"`
	Total          int       `json:"total"`
	PaidAt         *time.Time `json:"paidAt"`
	CreatedAt      time.Time `json:"createdAt"`
}

type OrderSummary struct {
	OrderID        string `json:"orderId"`
	Status         string `json:"status"`
	Total          int    `json:"total"`
	ProductName    string `json:"productName"`
	Quantity       int    `json:"quantity"`
}

func CreateOrder(db *sql.DB, merchantID, conversationID, customerPhone, productName string, price, quantity int) (string, error) {
	id := uuid.New().String()
	total := price * quantity
	_, err := db.Exec(`INSERT INTO orders (id, merchant_id, conversation_id, customer_phone, status, total, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'PENDING_CONFIRMATION', $5, NOW(), NOW())`,
		id, merchantID, conversationID, customerPhone, total)
	if err != nil {
		return "", err
	}
	return id, nil
}

func ConfirmOrder(db *sql.DB, orderID string) error {
	_, err := db.Exec("UPDATE orders SET status = 'CONFIRMED', updated_at = $1 WHERE id = $2", time.Now(), orderID)
	return err
}

func CancelOrder(db *sql.DB, orderID string) error {
	_, err := db.Exec("UPDATE orders SET status = 'CANCELLED', updated_at = $1 WHERE id = $2", time.Now(), orderID)
	if err != nil {
		return err
	}
	_, _ = db.Exec("UPDATE inventory_reservations SET released = true WHERE order_id = $1 AND released = false", orderID)
	return nil
}

func GetOrderSummary(db *sql.DB, orderID string) (*OrderSummary, error) {
	var s OrderSummary
	s.OrderID = orderID
	err := db.QueryRow("SELECT status, total FROM orders WHERE id = $1", orderID).Scan(&s.Status, &s.Total)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func SetPaymentReference(db *sql.DB, orderID, reference, checkoutURL string) error {
	_, err := db.Exec("UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, updated_at = NOW() WHERE id = $3", reference, checkoutURL, orderID)
	return err
}

func SetMoolreTransactionID(db *sql.DB, orderID, txID string) error {
	_, err := db.Exec("UPDATE orders SET moolre_transaction_id = $1, updated_at = NOW() WHERE id = $2", txID, orderID)
	return err
}

func GetOrderCheckoutURL(db *sql.DB, orderID string) (string, error) {
	var url string
	err := db.QueryRow("SELECT COALESCE(payment_checkout_url, '') FROM orders WHERE id = $1", orderID).Scan(&url)
	return url, err
}

func GetFirstOrderTime(db *sql.DB, merchantID string) (*time.Time, error) {
	var t time.Time
	err := db.QueryRow("SELECT MIN(o.created_at) FROM orders o WHERE o.merchant_id = $1 AND o.paid_at IS NOT NULL", merchantID).Scan(&t)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
