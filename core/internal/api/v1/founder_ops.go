package v1

import (
	"database/sql"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/clerk/core/internal/platform"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func founderScorecardListHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`SELECT id, name, COALESCE(score, 0), COALESCE(notes, ''), created_at
			FROM founder_scorecards ORDER BY created_at DESC LIMIT 50`)
		if err != nil {
			api.InternalError(c, "failed to list scorecards")
			return
		}
		defer rows.Close()

		var scorecards []gin.H
		for rows.Next() {
			var id, name, notes string
			var score int
			var createdAt time.Time
			if err := rows.Scan(&id, &name, &score, &notes, &createdAt); err != nil {
				continue
			}
			scorecards = append(scorecards, gin.H{
				"id": id, "name": name, "score": score, "notes": notes, "createdAt": createdAt,
			})
		}
		if scorecards == nil {
			scorecards = []gin.H{}
		}
		api.OK(c, gin.H{"scorecards": scorecards})
	}
}

func founderScorecardUpsertHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ID    *string `json:"id"`
			Name  string  `json:"name" binding:"required"`
			Score int     `json:"score"`
			Notes string  `json:"notes"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		if req.ID != nil && *req.ID != "" {
			_, err := db.Exec(`UPDATE founder_scorecards SET name = $1, score = $2, notes = $3, updated_at = NOW() WHERE id = $4`,
				req.Name, req.Score, req.Notes, *req.ID)
			if err != nil {
				api.InternalError(c, "failed to update scorecard")
				return
			}
			api.OK(c, gin.H{"status": "updated", "id": *req.ID})
			return
		}

		id := uuid.New().String()
		_, err := db.Exec(`INSERT INTO founder_scorecards (id, name, score, notes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, NOW(), NOW())`, id, req.Name, req.Score, req.Notes)
		if err != nil {
			api.InternalError(c, "failed to create scorecard")
			return
		}
		api.Created(c, gin.H{"id": id, "status": "created"})
	}
}

func founderOutreachCreateHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			MerchantID string `json:"merchantId" binding:"required"`
			Channel    string `json:"channel"`
			Message    string `json:"message" binding:"required"`
			Subject    string `json:"subject"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		if req.Channel == "" {
			req.Channel = "whatsapp"
		}

		id := uuid.New().String()
		_, err := db.Exec(`INSERT INTO founder_outreach (id, merchant_id, channel, message, subject, status, created_at)
			VALUES ($1, $2, $3, $4, $5, 'sent', NOW())`, id, req.MerchantID, req.Channel, req.Message, req.Subject)
		if err != nil {
			api.InternalError(c, "failed to create outreach")
			return
		}
		api.Created(c, gin.H{"id": id, "status": "sent"})
	}
}

func founderOutreachDeleteHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		result, err := db.Exec("DELETE FROM founder_outreach WHERE id = $1", id)
		if err != nil {
			api.InternalError(c, "failed to delete outreach")
			return
		}
		affected, _ := result.RowsAffected()
		if affected == 0 {
			api.NotFound(c, "outreach record not found")
			return
		}
		api.OK(c, gin.H{"status": "deleted"})
	}
}

func founderOutreachListHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`SELECT id, merchant_id, channel, COALESCE(message, ''), COALESCE(subject, ''),
			status, created_at FROM founder_outreach ORDER BY created_at DESC LIMIT 50`)
		if err != nil {
			api.InternalError(c, "failed to list outreach")
			return
		}
		defer rows.Close()

		var outreach []gin.H
		for rows.Next() {
			var id, merchantID, channel, message, subject, status string
			var createdAt time.Time
			if err := rows.Scan(&id, &merchantID, &channel, &message, &subject, &status, &createdAt); err != nil {
				continue
			}
			outreach = append(outreach, gin.H{
				"id": id, "merchantId": merchantID, "channel": channel,
				"message": message, "subject": subject, "status": status, "createdAt": createdAt,
			})
		}
		if outreach == nil {
			outreach = []gin.H{}
		}
		api.OK(c, gin.H{"outreach": outreach})
	}
}

func founderOutreachStatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var total, sent, responded int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM founder_outreach").Scan(&total)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM founder_outreach WHERE status = 'sent'").Scan(&sent)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM founder_outreach WHERE status = 'responded'").Scan(&responded)

		responseRate := 0.0
		if total > 0 {
			responseRate = float64(responded) / float64(total) * 100
		}

		api.OK(c, gin.H{
			"total":        total,
			"sent":         sent,
			"responded":    responded,
			"responseRate": responseRate,
		})
	}
}

func founderContentGetHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query("SELECT key, value, updated_at FROM founder_content ORDER BY key")
		if err != nil {
			api.InternalError(c, "failed to get content")
			return
		}
		defer rows.Close()

		content := make(map[string]string)
		for rows.Next() {
			var key, value string
			var updatedAt time.Time
			if err := rows.Scan(&key, &value, &updatedAt); err != nil {
				continue
			}
			content[key] = value
		}
		api.OK(c, gin.H{"content": content})
	}
}

func founderContentUpsertHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req map[string]string
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		tx, err := db.Begin()
		if err != nil {
			api.InternalError(c, "database error")
			return
		}
		defer tx.Rollback()

		for key, value := range req {
			_, err := tx.Exec(`INSERT INTO founder_content (key, value, updated_at)
				VALUES ($1, $2, NOW())
				ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, key, value)
			if err != nil {
				api.InternalError(c, "failed to save content")
				return
			}
		}

		if err := tx.Commit(); err != nil {
			api.InternalError(c, "failed to save")
			return
		}
		api.OK(c, gin.H{"status": "saved"})
	}
}

func founderForecastHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		forecast, err := platform.GetForecast(db, 30)
		if err != nil {
			api.InternalError(c, "failed to get forecast")
			return
		}
		api.OK(c, gin.H{"forecast": forecast})
	}
}

func founderOnboardingHealthHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		health, err := platform.GetOnboardingHealth(db)
		if err != nil {
			api.InternalError(c, "failed to get onboarding health")
			return
		}

		var recentMerchants int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE created_at >= NOW() - INTERVAL '30 days'").Scan(&recentMerchants)

		completionRate := 0.0
		if health.TotalMerchants > 0 {
			completionRate = float64(health.WithFirstOrder) / float64(health.TotalMerchants) * 100
		}

		api.OK(c, gin.H{
			"totalMerchants":    health.TotalMerchants,
			"connectedMerchants": health.ConnectedMerchants,
			"withInventory":     health.WithInventory,
			"withFirstMessage":  health.WithFirstMessage,
			"withFirstOrder":    health.WithFirstOrder,
			"recentMerchants":   recentMerchants,
			"completionRate":    completionRate,
		})
	}
}
