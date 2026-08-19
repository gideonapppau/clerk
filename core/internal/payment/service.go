package payment

import (
	"database/sql"
	"fmt"
	"os"
	"time"
)

type Provider interface {
	CreateCheckout(amount int, email, reference, description string) (string, error)
	VerifyTransaction(reference string) (bool, error)
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

type CheckoutInstructions struct {
	Amount      int    `json:"amount"`
	Reference   string `json:"reference"`
	CheckoutURL string `json:"checkoutUrl"`
	Provider    string `json:"provider"`
}

type CheckoutRequest struct {
	MerchantID  string `json:"merchantId"`
	Amount      int    `json:"amount"`
	PhoneNumber string `json:"phoneNumber"`
	Reference   string `json:"reference"`
}

func (s *Service) CreateCheckout(merchantID, orderID string) (*CheckoutInstructions, error) {
	var amount int
	var paymentRef string
	err := s.db.QueryRow("SELECT total FROM orders WHERE id = $1 AND merchant_id = $2", orderID, merchantID).Scan(&amount)
	if err != nil {
		return nil, fmt.Errorf("payment: order not found: %w", err)
	}

	paymentMethod := s.getMerchantPaymentMethod(merchantID)
	reference := fmt.Sprintf("clrk_%s_%d", orderID[:8], time.Now().Unix())

	switch paymentMethod {
	case "paystack":
		return s.createPaystackCheckout(merchantID, orderID, amount, reference)
	case "moolre":
		return s.createMoolreCheckout(merchantID, orderID, amount, reference)
	default:
		_ = paymentRef
		return s.createPaystackCheckout(merchantID, orderID, amount, reference)
	}
}

func (s *Service) createPaystackCheckout(merchantID, orderID string, amount int, reference string) (*CheckoutInstructions, error) {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")
	if secretKey == "" {
		return nil, fmt.Errorf("payment: PAYSTACK_SECRET_KEY not configured")
	}

	var customerEmail string
	err := s.db.QueryRow("SELECT COALESCE(customer_email, CONCAT('customer_', $1, '@clerk.local')) FROM orders WHERE id = $1", orderID).Scan(&customerEmail)
	if err != nil {
		customerEmail = fmt.Sprintf("customer_%s@clerk.local", orderID[:8])
	}

	_ = secretKey
	checkoutURL := fmt.Sprintf("https://checkout.paystack.com/%s", reference)

	_, err = s.db.Exec(`UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, payment_provider = 'paystack', updated_at = NOW() WHERE id = $3`,
		reference, checkoutURL, orderID)
	if err != nil {
		return nil, fmt.Errorf("payment: update order: %w", err)
	}

	return &CheckoutInstructions{
		Amount:      amount,
		Reference:   reference,
		CheckoutURL: checkoutURL,
		Provider:    "paystack",
	}, nil
}

func (s *Service) createMoolreCheckout(merchantID, orderID string, amount int, reference string) (*CheckoutInstructions, error) {
	var phone string
	err := s.db.QueryRow("SELECT customer_phone FROM orders WHERE id = $1", orderID).Scan(&phone)
	if err != nil {
		return nil, fmt.Errorf("payment: no phone for moolre checkout: %w", err)
	}
	_ = phone
	checkoutURL := fmt.Sprintf("https://sandbox.moolre.com/checkout/%s", reference)

	_, err = s.db.Exec(`UPDATE orders SET payment_reference = $1, payment_checkout_url = $2, payment_provider = 'moolre', updated_at = NOW() WHERE id = $3`,
		reference, checkoutURL, orderID)
	if err != nil {
		return nil, fmt.Errorf("payment: update order: %w", err)
	}

	return &CheckoutInstructions{
		Amount:      amount,
		Reference:   reference,
		CheckoutURL: checkoutURL,
		Provider:    "moolre",
	}, nil
}

func (s *Service) VerifyPayment(provider, reference string) (bool, error) {
	switch provider {
	case "paystack":
		return s.verifyPaystack(reference)
	case "moolre":
		return s.verifyMoolre(reference)
	default:
		return false, fmt.Errorf("unsupported provider: %s", provider)
	}
}

func (s *Service) verifyPaystack(reference string) (bool, error) {
	var status string
	err := s.db.QueryRow("SELECT status FROM orders WHERE payment_reference = $1", reference).Scan(&status)
	if err != nil {
		return false, err
	}
	return status == "CONFIRMED", nil
}

func (s *Service) verifyMoolre(reference string) (bool, error) {
	var status string
	err := s.db.QueryRow("SELECT status FROM orders WHERE payment_reference = $1", reference).Scan(&status)
	if err != nil {
		return false, err
	}
	return status == "CONFIRMED", nil
}

func (s *Service) getMerchantPaymentMethod(merchantID string) string {
	var method string
	err := s.db.QueryRow("SELECT COALESCE(payment_method, 'paystack') FROM merchants WHERE id = $1", merchantID).Scan(&method)
	if err != nil {
		return "paystack"
	}
	if method == "" {
		return "paystack"
	}
	return method
}
