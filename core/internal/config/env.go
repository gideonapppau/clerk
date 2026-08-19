package config

import (
	"fmt"
	"os"
	"strings"
)

type Env struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	GroqAPIKey      string
	OpenAIAPIKey    string
	LLMOpenAIModel  string
	GatewayURL      string
	CoreURL         string
	AppURL          string
	ClerkEnv        string
	MoolrePrivKey   string
	MoolrePubKey    string
	MoolreWebhook   string
	PaystackPlan    string
	VapidPrivate    string
	VapidPublic     string
	RecoveryAll     bool
	RecoveryDelay   string
	FounderHosting  string
	FounderBSP      string
}

func Load() *Env {
	return &Env{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		GroqAPIKey:     os.Getenv("GROQ_API_KEY"),
		OpenAIAPIKey:   os.Getenv("OPENAI_API_KEY"),
		LLMOpenAIModel: os.Getenv("LLM_OPENAI_MODEL"),
		GatewayURL:     os.Getenv("GATEWAY_URL"),
		CoreURL:        os.Getenv("CORE_URL"),
		AppURL:         os.Getenv("APP_URL"),
		ClerkEnv:       getEnv("CLERK_ENV", "development"),
		MoolrePrivKey:  os.Getenv("MOOLRE_PRIVATE_KEY"),
		MoolrePubKey:   os.Getenv("MOOLRE_PUBLIC_KEY"),
		MoolreWebhook:  os.Getenv("MOOLRE_WEBHOOK_SECRET"),
		PaystackPlan:   os.Getenv("CLERK_PAYSTACK_PLAN_GROWTH"),
		VapidPrivate:   os.Getenv("VAPID_PRIVATE_KEY"),
		VapidPublic:    os.Getenv("VAPID_PUBLIC_KEY"),
		RecoveryAll:    os.Getenv("PAYMENT_RECOVERY_ALL_PLANS") == "true",
		RecoveryDelay:  getEnv("PAYMENT_RECOVERY_DELAY", "30m"),
		FounderHosting: getEnv("FOUNDER_HOSTING_USD_MONTH", "10"),
		FounderBSP:     getEnv("FOUNDER_BSP_USD_MONTH", "15"),
	}
}

func getEnv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}

func (e *Env) IsProduction() bool {
	return strings.EqualFold(e.ClerkEnv, "production")
}

func (e *Env) GatewayURLStr() string {
	return e.GatewayURL
}

func PaystackCheckoutURL(reference, accessCode string) string {
	return fmt.Sprintf("https://checkout.paystack.com/%s", accessCode)
}

func MoolreBaseURL() string {
	if os.Getenv("CLERK_ENV") == "production" {
		return "https://api.moolre.com"
	}
	return "https://sandbox.moolre.com"
}
