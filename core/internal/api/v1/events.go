package v1

import (
	"database/sql"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/gin-gonic/gin"
)

func listEventsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		typeFilter := c.Query("type")

		query := "SELECT id, type, payload, created_at FROM merchant_events WHERE merchant_id = $1"
		args := []interface{}{merchantID}
		if typeFilter != "" {
			query += " AND type = $2"
			args = append(args, typeFilter)
		}
		query += " ORDER BY created_at DESC LIMIT 100"

		rows, err := db.Query(query, args...)
		if err != nil {
			api.InternalError(c, "failed to list events")
			return
		}
		defer rows.Close()

		var events []gin.H
		for rows.Next() {
			var id, eventType, payload string
			var createdAt time.Time
			if err := rows.Scan(&id, &eventType, &payload, &createdAt); err != nil {
				continue
			}
			events = append(events, gin.H{
				"id": id, "type": eventType, "payload": payload, "createdAt": createdAt,
			})
		}
		if events == nil {
			events = []gin.H{}
		}
		api.OK(c, gin.H{"events": events})
	}
}
