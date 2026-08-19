package middleware

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/clerk/core/internal/auth"
	"github.com/gin-gonic/gin"
)

func RequireAuthDB(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			return
		}
		tokenStr := parts[1]
		merchantID, err := auth.ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		var exists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchants WHERE id = $1)", merchantID).Scan(&exists)
		if err != nil || !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "merchant not found"})
			return
		}
		c.Set("merchantId", merchantID)
		c.Next()
	}
}

func MerchantID() gin.HandlerFunc {
	return func(c *gin.Context) {
		mid, exists := c.Get("merchantId")
		if !exists || mid.(string) == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "merchantId not set"})
			return
		}
		c.Next()
	}
}
