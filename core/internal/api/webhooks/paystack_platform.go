package webhooks

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func platformPaystackHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
			return
		}

		var payload map[string]interface{}
		if err := json.Unmarshal(body, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
			return
		}

		event, _ := payload["event"].(string)
		switch event {
		case "subscription.create":
			fmt.Printf("paystack platform: subscription created\n")
		case "invoice.payment_failed":
			fmt.Printf("paystack platform: invoice payment failed\n")
		case "invoice.update":
			fmt.Printf("paystack platform: invoice updated\n")
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}
