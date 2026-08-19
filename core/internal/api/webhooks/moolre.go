package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func moolrePaymentWebhook(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
			return
		}

		signature := c.GetHeader("X-Moolre-Signature")
		secret := os.Getenv("MOOLRE_WEBHOOK_SECRET")
		if secret != "" && signature != "" {
			if !verifyMoolreSignature(body, signature, secret) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
				return
			}
		}

		payload, err := parseMoolreWebhook(body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		for _, tx := range payload.Data.Transactions {
			if tx.TxStatus == 1 {
				now := time.Now()
				_, err := db.Exec(
					"UPDATE orders SET status = 'CONFIRMED', paid_at = $1, updated_at = $1 WHERE id = $2 AND status != 'CONFIRMED'",
					now, tx.ExternalRef)
				if err != nil {
					fmt.Printf("moolre webhook: failed to confirm order %s: %v\n", tx.ExternalRef, err)
					continue
				}
				fmt.Printf("moolre webhook: confirmed order %s\n", tx.ExternalRef)
			}
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

type moolreWebhookPayload struct {
	Status int `json:"status"`
	Data   struct {
		Transactions []struct {
			TxStatus      int    `json:"txstatus"`
			Amount        string `json:"amount"`
			Value         string `json:"value"`
			TransactionID string `json:"transactionid"`
			ExternalRef   string `json:"externalref"`
		} `json:"transactions"`
	} `json:"data"`
}

func parseMoolreWebhook(body []byte) (*moolreWebhookPayload, error) {
	var payload moolreWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("invalid moolre webhook payload: %w", err)
	}
	return &payload, nil
}

func verifyMoolreSignature(body []byte, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}
