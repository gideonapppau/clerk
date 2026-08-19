package v1

import (
	"database/sql"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/clerk/core/internal/commerce"
	"github.com/gin-gonic/gin"
)

func getConversationHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		conversationID := c.Param("conversationId")

		var status, customerPhone, mode, state string
		err := db.QueryRow(`SELECT status, customer_phone, COALESCE(mode, 'BOT'), COALESCE(state, 'idle')
			FROM conversations WHERE id = $1 AND merchant_id = $2`, conversationID, merchantID).
			Scan(&status, &customerPhone, &mode, &state)
		if err != nil {
			api.NotFound(c, "conversation not found")
			return
		}

		rows, err := db.Query("SELECT id, sender, body, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", conversationID)
		if err != nil {
			api.InternalError(c, "failed to load messages")
			return
		}
		defer rows.Close()

		var messages []gin.H
		for rows.Next() {
			var id, sender, body string
			var createdAt time.Time
			if err := rows.Scan(&id, &sender, &body, &createdAt); err != nil {
				continue
			}
			messages = append(messages, gin.H{
				"id": id, "sender": sender, "body": body, "createdAt": createdAt,
			})
		}
		if messages == nil {
			messages = []gin.H{}
		}

		api.OK(c, gin.H{
			"id":           conversationID,
			"status":       status,
			"customerPhone": customerPhone,
			"mode":         mode,
			"state":        state,
			"messages":     messages,
		})
	}
}

func listConversationsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		statusFilter := c.Query("status")

		query := `SELECT c.id, c.status, c.customer_phone, c.created_at,
			COALESCE(m.body, '') as last_message, m.created_at as last_message_at
			FROM conversations c
			LEFT JOIN messages m ON m.conversation_id = c.id AND m.created_at = (
				SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id
			)
			WHERE c.merchant_id = $1`
		args := []interface{}{merchantID}

		if statusFilter != "" {
			query += ` AND c.status = $2`
			args = append(args, statusFilter)
		}

		query += ` ORDER BY c.updated_at DESC LIMIT 50`

		rows, err := db.Query(query, args...)
		if err != nil {
			api.InternalError(c, "failed to list conversations")
			return
		}
		defer rows.Close()

		var conversations []gin.H
		for rows.Next() {
			var id, status, phone string
			var createdAt time.Time
			var lastMsg, lastMsgAt sql.NullString
			if err := rows.Scan(&id, &status, &phone, &createdAt, &lastMsg, &lastMsgAt); err != nil {
				continue
			}
			conv := gin.H{
				"id": id, "status": status, "customerPhone": phone, "createdAt": createdAt,
			}
			if lastMsg.Valid {
				conv["lastMessage"] = lastMsg.String
			}
			if lastMsgAt.Valid {
				conv["lastMessageAt"] = lastMsgAt.String
			}
			conversations = append(conversations, conv)
		}
		if conversations == nil {
			conversations = []gin.H{}
		}

		api.OK(c, gin.H{"conversations": conversations})
	}
}

func resumeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		conversationID := c.Param("conversationId")

		var ownerID, currentStatus string
		err := db.QueryRow("SELECT merchant_id, status FROM conversations WHERE id = $1", conversationID).
			Scan(&ownerID, &currentStatus)
		if err != nil {
			api.NotFound(c, "conversation not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your conversation")
			return
		}

		if currentStatus == "MERCHANT_ENGAGED" || currentStatus == "WAITING_MERCHANT" {
			_, err = db.Exec("UPDATE conversations SET status = 'ACTIVE', mode = 'BOT', updated_at = NOW() WHERE id = $1", conversationID)
			if err != nil {
				api.InternalError(c, "failed to resume conversation")
				return
			}
			_, _ = db.Exec("UPDATE conversations SET state = 'idle', updated_at = NOW() WHERE id = $1", conversationID)
		}

		_, _ = commerce.EmitEvent(db, merchantID, "conversation_resumed", conversationID)

		api.OK(c, gin.H{"status": "resumed", "conversationId": conversationID})
	}
}

func takeoverHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		conversationID := c.Param("conversationId")

		var ownerID string
		err := db.QueryRow("SELECT merchant_id FROM conversations WHERE id = $1", conversationID).Scan(&ownerID)
		if err != nil {
			api.NotFound(c, "conversation not found")
			return
		}
		if ownerID != merchantID {
			api.Forbidden(c, "not your conversation")
			return
		}

		_, err = db.Exec("UPDATE conversations SET status = 'MERCHANT_ENGAGED', mode = 'HUMAN', updated_at = NOW() WHERE id = $1 AND merchant_id = $2",
			conversationID, merchantID)
		if err != nil {
			api.InternalError(c, "failed to take over conversation")
			return
		}

		_, _ = commerce.EmitEvent(db, merchantID, "merchant_takeover", conversationID)

		api.OK(c, gin.H{"status": "taken_over", "conversationId": conversationID})
	}
}
