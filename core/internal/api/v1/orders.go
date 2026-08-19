package v1

import (
	"database/sql"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func listOrdersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		statusFilter := c.Query("status")
		offset := 0
		limit := 50

		query := `SELECT id, status, customer_phone, total, paid_at, created_at
			FROM orders WHERE merchant_id = $1`
		args := []interface{}{merchantID}
		argIdx := 2

		if statusFilter != "" {
			query += ` AND status = $` + itoa(argIdx)
			args = append(args, statusFilter)
			argIdx++
		}

		query += ` ORDER BY created_at DESC LIMIT $` + itoa(argIdx) + ` OFFSET $` + itoa(argIdx+1)
		args = append(args, limit, offset)

		rows, err := db.Query(query, args...)
		if err != nil {
			api.InternalError(c, "failed to list orders")
			return
		}
		defer rows.Close()

		var orders []gin.H
		for rows.Next() {
			var id, status, phone string
			var total int
			var paidAt sql.NullTime
			var createdAt time.Time
			if err := rows.Scan(&id, &status, &phone, &total, &paidAt, &createdAt); err != nil {
				continue
			}
			order := gin.H{
				"id": id, "status": status, "customerPhone": phone,
				"total": total, "createdAt": createdAt,
			}
			if paidAt.Valid {
				order["paidAt"] = paidAt.Time
			}
			orders = append(orders, order)
		}
		if orders == nil {
			orders = []gin.H{}
		}
		api.OK(c, gin.H{"orders": orders})
	}
}

func confirmOrderHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		orderID := c.Param("orderId")

		var ownerID string
		err := db.QueryRow("SELECT merchant_id FROM orders WHERE id = $1", orderID).Scan(&ownerID)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		now := time.Now()
		result, err := db.Exec("UPDATE orders SET status = 'CONFIRMED', updated_at = $1 WHERE id = $2 AND merchant_id = $3", now, orderID, merchantID)
		if err != nil {
			api.InternalError(c, "failed to confirm order")
			return
		}
		affected, _ := result.RowsAffected()
		if affected == 0 {
			api.NotFound(c, "order not found")
			return
		}
		api.OK(c, gin.H{"status": "confirmed", "orderId": orderID})
	}
}

func cancelOrderHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		orderID := c.Param("orderId")

		var ownerID string
		err := db.QueryRow("SELECT merchant_id FROM orders WHERE id = $1", orderID).Scan(&ownerID)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		now := time.Now()
		_, err = db.Exec("UPDATE orders SET status = 'CANCELLED', updated_at = $1 WHERE id = $2 AND merchant_id = $3", now, orderID, merchantID)
		if err != nil {
			api.InternalError(c, "failed to cancel order")
			return
		}

		_, _ = db.Exec("UPDATE inventory_reservations SET released = true WHERE order_id = $1 AND released = false", orderID)

		api.OK(c, gin.H{"status": "cancelled", "orderId": orderID})
	}
}

func getPublicOrderHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID := c.Param("orderId")
		var id, status, phone, checkoutURL string
		var total int
		var paidAt sql.NullTime
		var createdAt time.Time
		err := db.QueryRow(`SELECT id, status, customer_phone, COALESCE(payment_checkout_url, ''), total, paid_at, created_at
			FROM orders WHERE id = $1`, orderID).Scan(&id, &status, &phone, &checkoutURL, &total, &paidAt, &createdAt)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		result := gin.H{
			"id": id, "status": status, "total": total,
			"createdAt": createdAt,
		}
		if checkoutURL != "" {
			result["paymentCheckoutUrl"] = checkoutURL
		}
		if paidAt.Valid {
			result["paidAt"] = paidAt.Time
		}
		api.OK(c, result)
	}
}

func markOrderPaidAPIHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			OrderID string `json:"orderId" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		var ownerID string
		err := db.QueryRow("SELECT merchant_id FROM orders WHERE id = $1", req.OrderID).Scan(&ownerID)
		if err != nil {
			api.NotFound(c, "order not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your order")
			return
		}

		now := time.Now()
		_, err = db.Exec("UPDATE orders SET status = 'CONFIRMED', paid_at = $1, updated_at = $1 WHERE id = $2 AND merchant_id = $3", now, req.OrderID, merchantID)
		if err != nil {
			api.InternalError(c, "failed to mark order as paid")
			return
		}
		_, _ = db.Exec("UPDATE inventory_reservations SET released = true WHERE order_id = $1 AND released = false", req.OrderID)
		api.OK(c, gin.H{"status": "paid", "orderId": req.OrderID})
	}
}

func createOrder(db *sql.DB, merchantID, conversationID, customerPhone string, total int) (string, error) {
	id := uuid.New().String()
	_, err := db.Exec(`INSERT INTO orders (id, merchant_id, conversation_id, customer_phone, status, total, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'PENDING_CONFIRMATION', $5, NOW(), NOW())`,
		id, merchantID, conversationID, customerPhone, total)
	if err != nil {
		return "", err
	}
	return id, nil
}

func itoa(n int) string {
	s := make([]byte, 0, 3)
	if n >= 100 {
		s = append(s, byte('0'+n/100))
		n %= 100
	}
	if n >= 10 {
		s = append(s, byte('0'+n/10))
		n %= 10
	}
	s = append(s, byte('0'+n))
	return string(s)
}
