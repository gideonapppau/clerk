package middleware

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/clerk/core/internal/auth"
	"github.com/gin-gonic/gin"
)

func RequireFounder(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
			return
		}
		tokenStr := parts[1]
		merchantID, err := auth.ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if db != nil {
			var isFounder bool
			err = db.QueryRow("SELECT COALESCE(is_founder, false) FROM merchants WHERE id = $1", merchantID).Scan(&isFounder)
			if err != nil || !isFounder {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "founder access required"})
				return
			}
		}
		c.Set("merchantId", merchantID)
		c.Set("role", "founder")
		c.Next()
	}
}
