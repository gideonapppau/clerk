package moolre

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
)

func (c *Client) Authenticate() error {
	if c.privateKey == "" {
		return fmt.Errorf("moolre private key not configured")
	}
	return nil
}

func (c *Client) GenerateAuthHeader() string {
	return "Bearer " + c.privateKey
}

func VerifyAuth(key string) bool {
	return key != ""
}

func WebhookSecret() string {
	return os.Getenv("MOOLRE_WEBHOOK_SECRET")
}

func GenerateWebhookSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}
