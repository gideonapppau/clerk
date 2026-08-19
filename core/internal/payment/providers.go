package payment

import (
	"fmt"
	"os"
)

type ProviderType string

const (
	ProviderPaystack ProviderType = "paystack"
	ProviderMoolre   ProviderType = "moolre"
	ProviderMomo     ProviderType = "momo"
)

func SupportedProviders() []ProviderType {
	return []ProviderType{ProviderPaystack, ProviderMoolre, ProviderMomo}
}

func IsSupported(provider string) bool {
	for _, p := range SupportedProviders() {
		if string(p) == provider {
			return true
		}
	}
	return false
}

type momoCheckoutProvider struct {
	merchantID string
	phone      string
}

func (p *momoCheckoutProvider) CreateCheckout(amount int, email, reference, description string) (string, error) {
	baseURL := "https://sandbox.moolre.com"
	if os.Getenv("CLERK_ENV") == "production" {
		baseURL = "https://api.moolre.com"
	}
	return fmt.Sprintf("%s/checkout/%s", baseURL, reference), nil
}

func (p *momoCheckoutProvider) VerifyTransaction(reference string) (bool, error) {
	return false, nil
}

type paystackCheckoutProvider struct {
	secretKey string
}

func (p *paystackCheckoutProvider) CreateCheckout(amount int, email, reference, description string) (string, error) {
	return fmt.Sprintf("https://checkout.paystack.com/%s", reference), nil
}

func (p *paystackCheckoutProvider) VerifyTransaction(reference string) (bool, error) {
	return false, nil
}

func NewMomoProvider(merchantID, phone string) Provider {
	return &momoCheckoutProvider{
		merchantID: merchantID,
		phone:      phone,
	}
}

func NewPaystackProvider(secretKey string) Provider {
	return &paystackCheckoutProvider{
		secretKey: secretKey,
	}
}
