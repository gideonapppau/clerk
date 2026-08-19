package api

import (
	"database/sql"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func MerchantHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("merchantId")
		if id == "" {
			merchantID, _ := c.Get("merchantId")
			if mid, ok := merchantID.(string); ok {
				id = mid
			}
		}
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "merchantId required"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"merchantId": id})
	}
}

func MessageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, _ := io.ReadAll(c.Request.Body)
		_ = body
		var req struct {
			MerchantID    string `json:"merchantId"`
			CustomerPhone string `json:"customerPhone"`
			Text          string `json:"text"`
			MessageKind   string `json:"messageKind"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "received"})
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
