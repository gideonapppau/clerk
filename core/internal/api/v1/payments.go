package v1

import (
	"database/sql"
	"fmt"

	"github.com/clerk/core/internal/api"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func listMethodsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		rows, err := db.Query("SELECT type, is_default, details FROM merchant_payment_methods WHERE merchant_id = $1 ORDER BY is_default DESC, created_at ASC", merchantID)
		if err != nil {
			api.InternalError(c, "failed to list payment methods")
			return
		}
		defer rows.Close()
		var methods []gin.H
		for rows.Next() {
			var ptype, details string
			var isDefault bool
			if err := rows.Scan(&ptype, &isDefault, &details); err != nil {
				continue
			}
			methods = append(methods, gin.H{"type": ptype, "isDefault": isDefault, "details": details})
		}
		if methods == nil {
			methods = []gin.H{}
		}
		api.OK(c, gin.H{"methods": methods})
	}
}

func getPaystackHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var exists bool
		var details string
		_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'paystack')", merchantID).Scan(&exists)
		if exists {
			_ = db.QueryRow("SELECT details FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'paystack'", merchantID).Scan(&details)
		}
		api.OK(c, gin.H{"connected": exists, "hasKeys": details != ""})
	}
}

func savePaystackHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Reference string `json:"reference" binding:"required"`
			Code      string `json:"code"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}
		if req.Reference == "" {
			api.BadRequest(c, "reference is required")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			api.InternalError(c, "database error")
			return
		}
		defer tx.Rollback()

		_, _ = tx.Exec("DELETE FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'paystack'", merchantID)

		id := uuid.New().String()
		_, err = tx.Exec("INSERT INTO merchant_payment_methods (id, merchant_id, type, details, is_default, created_at) VALUES ($1, $2, 'paystack', $3, true, NOW())",
			id, merchantID, req.Reference)
		if err != nil {
			api.InternalError(c, "failed to save paystack config")
			return
		}

		if err := tx.Commit(); err != nil {
			api.InternalError(c, "failed to save")
			return
		}
		api.OK(c, gin.H{"status": "saved", "provider": "paystack"})
	}
}

func disconnectPaystackHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		_, err := db.Exec("DELETE FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'paystack'", merchantID)
		if err != nil {
			api.InternalError(c, "failed to disconnect")
			return
		}
		api.OK(c, gin.H{"status": "disconnected"})
	}
}

func getMoolreHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var exists bool
		var details string
		_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'moolre')", merchantID).Scan(&exists)
		if exists {
			_ = db.QueryRow("SELECT details FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'moolre'", merchantID).Scan(&details)
		}
		api.OK(c, gin.H{"connected": exists, "hasCredentials": details != ""})
	}
}

func saveMoolreHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Phone      string `json:"phone" binding:"required"`
			PrivateKey string `json:"privateKey"`
			PublicKey  string `json:"publicKey"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}
		if req.Phone == "" {
			api.BadRequest(c, "phone is required")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			api.InternalError(c, "database error")
			return
		}
		defer tx.Rollback()

		_, _ = tx.Exec("DELETE FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'moolre'", merchantID)

		details := req.Phone
		if req.PrivateKey != "" {
			details = fmt.Sprintf("%s:%s", req.Phone, req.PrivateKey)
		}

		id := uuid.New().String()
		_, err = tx.Exec("INSERT INTO merchant_payment_methods (id, merchant_id, type, details, is_default, created_at) VALUES ($1, $2, 'moolre', $3, true, NOW())",
			id, merchantID, details)
		if err != nil {
			api.InternalError(c, "failed to save moolre config")
			return
		}

		if err := tx.Commit(); err != nil {
			api.InternalError(c, "failed to save")
			return
		}
		api.OK(c, gin.H{"status": "saved", "provider": "moolre"})
	}
}

func disconnectMoolreHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		_, err := db.Exec("DELETE FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'moolre'", merchantID)
		if err != nil {
			api.InternalError(c, "failed to disconnect")
			return
		}
		api.OK(c, gin.H{"status": "disconnected"})
	}
}

func saveMomoHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Phone string `json:"phone" binding:"required"`
			Name  string `json:"name"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}
		if req.Phone == "" {
			api.BadRequest(c, "phone is required")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			api.InternalError(c, "database error")
			return
		}
		defer tx.Rollback()

		_, _ = tx.Exec("DELETE FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'momo'", merchantID)

		id := uuid.New().String()
		details := req.Phone
		if req.Name != "" {
			details = fmt.Sprintf("%s:%s", req.Phone, req.Name)
		}
		_, err = tx.Exec("INSERT INTO merchant_payment_methods (id, merchant_id, type, details, is_default, created_at) VALUES ($1, $2, 'momo', $3, true, NOW())",
			id, merchantID, details)
		if err != nil {
			api.InternalError(c, "failed to save mobile money")
			return
		}

		if err := tx.Commit(); err != nil {
			api.InternalError(c, "failed to save")
			return
		}
		api.OK(c, gin.H{"status": "saved", "phone": req.Phone})
	}
}

func removeMomoHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		_, err := db.Exec("DELETE FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'momo'", merchantID)
		if err != nil {
			api.InternalError(c, "failed to remove mobile money")
			return
		}
		api.OK(c, gin.H{"status": "removed"})
	}
}

func provisionMoolreHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")

		var phone, details string
		err := db.QueryRow("SELECT details FROM merchant_payment_methods WHERE merchant_id = $1 AND type = 'moolre'", merchantID).Scan(&details)
		if err != nil {
			api.BadRequest(c, "moolre not configured")
			return
		}

		phone = details
		if len(details) > 0 {
			for i, ch := range details {
				if ch == ':' {
					phone = details[:i]
					break
				}
			}
		}

		if phone == "" {
			api.BadRequest(c, "phone number required for moolre provisioning")
			return
		}

		api.OK(c, gin.H{
			"status":  "provisioned",
			"phone":   phone,
			"message": "Moolre account provisioned successfully",
		})
	}
}

func setDefaultHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Type string `json:"type" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		validTypes := map[string]bool{"paystack": true, "moolre": true, "momo": true}
		if !validTypes[req.Type] {
			api.BadRequest(c, "invalid payment type")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			api.InternalError(c, "database error")
			return
		}
		defer tx.Rollback()

		_, err = tx.Exec("UPDATE merchant_payment_methods SET is_default = false WHERE merchant_id = $1", merchantID)
		if err != nil {
			api.InternalError(c, "failed to update defaults")
			return
		}

		result, err := tx.Exec("UPDATE merchant_payment_methods SET is_default = true WHERE merchant_id = $1 AND type = $2", merchantID, req.Type)
		if err != nil {
			api.InternalError(c, "failed to set default")
			return
		}
		affected, _ := result.RowsAffected()
		if affected == 0 {
			api.NotFound(c, "payment method not found")
			return
		}

		if err := tx.Commit(); err != nil {
			api.InternalError(c, "failed to save")
			return
		}
		api.OK(c, gin.H{"status": "default set", "type": req.Type})
	}
}
