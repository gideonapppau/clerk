package middleware

import (
	"database/sql"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func RequireWebhookSecret(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		envSecret := os.Getenv("MOOLRE_WEBHOOK_SECRET")
		headerSecret := c.GetHeader("X-Webhook-Secret")

		if headerSecret == "" {
			authHeader := c.GetHeader("Authorization")
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				headerSecret = authHeader[7:]
			}
		}

		if envSecret != "" && headerSecret == envSecret {
			c.Next()
			return
		}

		if db != nil && headerSecret != "" {
			var exists bool
			err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM webhook_secrets WHERE secret = $1)", headerSecret).Scan(&exists)
			if err == nil && exists {
				c.Next()
				return
			}
		}

		if envSecret == "" && headerSecret == "" {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid webhook secret"})
	}
}
