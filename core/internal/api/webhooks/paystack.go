package webhooks

import (
	"crypto/hmac"
	"crypto/sha512"
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

func paystackWebhook(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
			return
		}

		signature := c.GetHeader("X-Paystack-Signature")
		if signature == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing signature"})
			return
		}

		secret := os.Getenv("PAYSTACK_SECRET_KEY")
		if secret != "" {
			if !verifyPaystackSignature(body, signature, secret) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
				return
			}
		}

		var payload struct {
			Event string `json:"event"`
			Data  struct {
				Reference    string `json:"reference"`
				Status       string `json:"status"`
				Amount       int    `json:"amount"`
				Channel      string `json:"channel"`
				Customer     struct {
					Email string `json:"email"`
				} `json:"customer"`
			} `json:"data"`
		}
		if err := json.Unmarshal(body, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
			return
		}

		if payload.Event == "charge.success" {
			handleChargeSuccess(db, payload.Data.Reference, payload.Data.Status)
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func handleChargeSuccess(db *sql.DB, reference, status string) {
	now := time.Now()

	result, err := db.Exec(
		"UPDATE orders SET status = 'CONFIRMED', paid_at = $1, updated_at = $1 WHERE payment_reference = $2 AND status != 'CONFIRMED'",
		now, reference)
	if err != nil {
		fmt.Printf("paystack webhook: failed to confirm order ref=%s: %v\n", reference, err)
		return
	}
	affected, _ := result.RowsAffected()
	if affected > 0 {
		fmt.Printf("paystack webhook: confirmed order ref=%s\n", reference)
	}

	_, _ = db.Exec(`UPDATE merchant_billing SET status = 'verified', verified_at = $1, updated_at = $1
		WHERE reference = $2 AND status != 'verified'`, now, reference)
}

func verifyPaystackSignature(body []byte, signature, secret string) bool {
	mac := hmac.New(sha512.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}


