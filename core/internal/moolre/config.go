package moolre

import (
	"os"
)

type Config struct {
	APIKey       string
	PublicKey    string
	PrivateKey   string
	Host         string
	Sandbox      bool
	WebhookSecret string
}

func Load() *Config {
	return LoadConfig()
}

func LoadConfig() *Config {
	privateKey := os.Getenv("MOOLRE_PRIVATE_KEY")
	publicKey := os.Getenv("MOOLRE_PUBLIC_KEY")
	sandbox := os.Getenv("CLERK_ENV") != "production"
	host := SandboxHost.URL()
	if !sandbox {
		host = ProductionHost.URL()
	}
	return &Config{
		APIKey:       privateKey,
		PrivateKey:   privateKey,
		PublicKey:    publicKey,
		Host:         host,
		Sandbox:      sandbox,
		WebhookSecret: os.Getenv("MOOLRE_WEBHOOK_SECRET"),
	}
}

func (c *Config) BaseURL() string {
	if c.Host != "" {
		return c.Host
	}
	return SandboxHost.URL()
}

func (c *Config) IsConfigured() bool {
	return c.PrivateKey != "" && c.PublicKey != ""
}
