package v1

import (
	"database/sql"
	"time"

	"github.com/clerk/core/internal/api"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func founderPipelineCreateHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Name   string `json:"name" binding:"required"`
			Stage  string `json:"stage"`
			Notes  string `json:"notes"`
			Priority int  `json:"priority"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		if req.Stage == "" {
			req.Stage = "lead"
		}

		id := uuid.New().String()
		_, err := db.Exec(`INSERT INTO founder_pipeline (id, name, stage, notes, priority, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, id, req.Name, req.Stage, req.Notes, req.Priority)
		if err != nil {
			api.InternalError(c, "failed to create pipeline entry")
			return
		}
		api.Created(c, gin.H{"id": id, "status": "created"})
	}
}

func founderPipelineListHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stageFilter := c.Query("stage")

		query := "SELECT id, name, stage, COALESCE(notes, ''), COALESCE(priority, 0), created_at FROM founder_pipeline"
		args := []interface{}{}

		if stageFilter != "" {
			query += " WHERE stage = $1"
			args = append(args, stageFilter)
		}
		query += " ORDER BY priority DESC, created_at DESC"

		rows, err := db.Query(query, args...)
		if err != nil {
			api.InternalError(c, "failed to list pipeline")
			return
		}
		defer rows.Close()

		var items []gin.H
		for rows.Next() {
			var id, name, stage, notes string
			var priority int
			var createdAt time.Time
			if err := rows.Scan(&id, &name, &stage, &notes, &priority, &createdAt); err != nil {
				continue
			}
			items = append(items, gin.H{
				"id": id, "name": name, "stage": stage, "notes": notes,
				"priority": priority, "createdAt": createdAt,
			})
		}
		if items == nil {
			items = []gin.H{}
		}
		api.OK(c, gin.H{"pipeline": items})
	}
}

func founderPipelineUpdateHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			Name     *string `json:"name"`
			Stage    *string `json:"stage"`
			Notes    *string `json:"notes"`
			Priority *int    `json:"priority"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			api.BadRequest(c, err.Error())
			return
		}

		if req.Name != nil {
			_, _ = db.Exec("UPDATE founder_pipeline SET name = $1, updated_at = NOW() WHERE id = $2", *req.Name, id)
		}
		if req.Stage != nil {
			_, _ = db.Exec("UPDATE founder_pipeline SET stage = $1, updated_at = NOW() WHERE id = $2", *req.Stage, id)
		}
		if req.Notes != nil {
			_, _ = db.Exec("UPDATE founder_pipeline SET notes = $1, updated_at = NOW() WHERE id = $2", *req.Notes, id)
		}
		if req.Priority != nil {
			_, _ = db.Exec("UPDATE founder_pipeline SET priority = $1, updated_at = NOW() WHERE id = $2", *req.Priority, id)
		}

		api.OK(c, gin.H{"status": "updated"})
	}
}

func founderPipelineDeleteHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		result, err := db.Exec("DELETE FROM founder_pipeline WHERE id = $1", id)
		if err != nil {
			api.InternalError(c, "failed to delete pipeline entry")
			return
		}
		affected, _ := result.RowsAffected()
		if affected == 0 {
			api.NotFound(c, "pipeline entry not found")
			return
		}
		api.OK(c, gin.H{"status": "deleted"})
	}
}

func founderPipelineSummaryHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type StageSummary struct {
			Stage string `json:"stage"`
			Count int    `json:"count"`
		}

		rows, err := db.Query(`SELECT stage, COUNT(*)::int AS count
			FROM founder_pipeline GROUP BY stage ORDER BY count DESC`)
		if err != nil {
			api.InternalError(c, "failed to get pipeline summary")
			return
		}
		defer rows.Close()

		var stages []StageSummary
		var total int
		for rows.Next() {
			var s StageSummary
			if err := rows.Scan(&s.Stage, &s.Count); err != nil {
				continue
			}
			stages = append(stages, s)
			total += s.Count
		}

		api.OK(c, gin.H{
			"stages": stages,
			"total":  total,
		})
	}
}
