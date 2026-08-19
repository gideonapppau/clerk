package v1

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/clerk/core/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func MeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var name, phone, plan, businessScope string
		err := db.QueryRow("SELECT COALESCE(name, ''), COALESCE(phone, ''), COALESCE(plan, 'trial'), COALESCE(business_scope, '') FROM merchants WHERE id = $1", merchantID).Scan(&name, &phone, &plan, &businessScope)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "merchant not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":            merchantID,
			"name":          name,
			"phone":         phone,
			"plan":          plan,
			"businessScope": businessScope,
		})
	}
}

func PatchMeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Name          *string `json:"name"`
			BusinessScope *string `json:"businessScope"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Name != nil {
			_, err := db.Exec("UPDATE merchants SET name = $1, updated_at = NOW() WHERE id = $2", *req.Name, merchantID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update name"})
				return
			}
		}
		if req.BusinessScope != nil {
			_, err := db.Exec("UPDATE merchants SET business_scope = $1, updated_at = NOW() WHERE id = $2", *req.BusinessScope, merchantID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update business scope"})
				return
			}
		}
		c.JSON(http.StatusOK, gin.H{"status": "updated"})
	}
}

func loginHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Phone    string `json:"phone" binding:"required"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var merchantID string
		err := db.QueryRow("SELECT id FROM merchants WHERE phone = $1", req.Phone).Scan(&merchantID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		token, err := auth.SignToken(merchantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": token, "merchantId": merchantID})
	}
}

func registerHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Name  string `json:"name" binding:"required"`
			Phone string `json:"phone" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		id := uuid.New().String()
		now := time.Now()
		_, err := db.Exec("INSERT INTO merchants (id, name, phone, plan, created_at, updated_at) VALUES ($1, $2, $3, 'trial', $4, $4)", id, req.Name, req.Phone, now)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register merchant"})
			return
		}
		token, err := auth.SignToken(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"token": token, "merchantId": id})
	}
}

func logoutHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		_, _ = db.Exec("UPDATE merchants SET last_logout_at = NOW(), updated_at = NOW() WHERE id = $1", merchantID)
		c.JSON(http.StatusOK, gin.H{"status": "logged out"})
	}
}
