package moolre

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
)

func VerifyWebhookSignature(payload []byte, signature string) bool {
	secret := os.Getenv("MOOLRE_WEBHOOK_SECRET")
	if secret == "" {
		return true
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}

func (c *Client) VerifyPaymentStatus(reference string) (bool, error) {
	resp, err := c.VerifyPayment(reference)
	if err != nil {
		return false, fmt.Errorf("moolre verify: %w", err)
	}
	for _, tx := range resp.Data.Transactions {
		if IsPaymentSuccessful(tx) {
			return true, nil
		}
	}
	return false, nil
}
