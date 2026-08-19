package v1

import (
	"database/sql"

	"github.com/clerk/core/internal/api"
	"github.com/clerk/core/internal/platform"
	"github.com/gin-gonic/gin"
)

func founderOverviewHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var totalMerchants, liveMerchants, totalOrders int
		var totalRevenue float64
		var totalConversations int

		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&totalMerchants)
		_ = db.QueryRow("SELECT COUNT(DISTINCT merchant_id)::int FROM orders WHERE paid_at IS NOT NULL").Scan(&liveMerchants)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM orders").Scan(&totalOrders)
		_ = db.QueryRow("SELECT COALESCE(SUM(total), 0)::float FROM orders WHERE status = 'CONFIRMED'").Scan(&totalRevenue)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM conversations").Scan(&totalConversations)

		var activeConversations int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM conversations WHERE status = 'ACTIVE'").Scan(&activeConversations)

		var merchants30d int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE created_at >= NOW() - INTERVAL '30 days'").Scan(&merchants30d)

		var ordersToday int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours'").Scan(&ordersToday)

		api.OK(c, gin.H{
			"totalMerchants":     totalMerchants,
			"liveMerchants":      liveMerchants,
			"totalOrders":        totalOrders,
			"totalRevenue":       totalRevenue,
			"totalConversations": totalConversations,
			"activeConversations": activeConversations,
			"merchants30d":       merchants30d,
			"ordersToday":        ordersToday,
		})
	}
}

func founderMerchantsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type MerchantStatus struct {
			NoWhatsApp  int `json:"noWhatsApp"`
			NoInventory int `json:"noInventory"`
			NoFirstReply int `json:"noFirstReply"`
			NoOrder     int `json:"noOrder"`
			AtRisk      int `json:"atRisk"`
		}
		type OnboardingStats struct {
			Registered int `json:"registered"`
			Live       int `json:"live"`
			Connecting int `json:"connecting"`
			QR         int `json:"qr"`
			Stale      int `json:"stale"`
			Conflict   int `json:"conflict"`
		}

		var ms MerchantStatus
		var os OnboardingStats

		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&os.Registered)
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE connected = true").Scan(&os.Live)
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM merchants m
			WHERE m.id NOT IN (SELECT DISTINCT merchant_id FROM inventory WHERE active = true)
			AND m.connected = true`).Scan(&ms.NoInventory)
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM merchants m
			WHERE m.id NOT IN (SELECT DISTINCT c.merchant_id FROM conversations c JOIN messages m2 ON m2.conversation_id = c.id)
			AND m.connected = true`).Scan(&ms.NoFirstReply)
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM merchants m
			WHERE m.id NOT IN (SELECT DISTINCT merchant_id FROM orders WHERE paid_at IS NOT NULL)
			AND m.connected = true`).Scan(&ms.NoOrder)

		os.Connecting = os.Registered - os.Live
		if os.Connecting < 0 {
			os.Connecting = 0
		}

		var merchants []gin.H
		rows, err := db.Query(`SELECT id, COALESCE(name, ''), COALESCE(plan, 'trial'), connected,
			created_at FROM merchants ORDER BY created_at DESC LIMIT 50`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, name, plan string
				var connected bool
				var createdAt interface{}
				if err := rows.Scan(&id, &name, &plan, &connected, &createdAt); err != nil {
					continue
				}
				merchants = append(merchants, gin.H{
					"id": id, "name": name, "plan": plan, "connected": connected, "createdAt": createdAt,
				})
			}
		}

		api.OK(c, gin.H{
			"merchantStatus": ms,
			"onboarding":     os,
			"merchants":      merchants,
		})
	}
}

func founderFunnelHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		funnel := []gin.H{}

		var registered int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&registered)
		funnel = append(funnel, gin.H{"stage": "registered", "count": registered})

		var withPhone int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE phone != '' AND phone IS NOT NULL").Scan(&withPhone)
		funnel = append(funnel, gin.H{"stage": "with_phone", "count": withPhone})

		var connected int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE connected = true").Scan(&connected)
		funnel = append(funnel, gin.H{"stage": "connected", "count": connected})

		var withInventory int
		_ = db.QueryRow("SELECT COUNT(DISTINCT merchant_id)::int FROM inventory WHERE active = true").Scan(&withInventory)
		funnel = append(funnel, gin.H{"stage": "with_inventory", "count": withInventory})

		var withConversation int
		_ = db.QueryRow("SELECT COUNT(DISTINCT merchant_id)::int FROM conversations").Scan(&withConversation)
		funnel = append(funnel, gin.H{"stage": "with_conversation", "count": withConversation})

		var withOrder int
		_ = db.QueryRow("SELECT COUNT(DISTINCT merchant_id)::int FROM orders").Scan(&withOrder)
		funnel = append(funnel, gin.H{"stage": "with_order", "count": withOrder})

		var withPaidOrder int
		_ = db.QueryRow("SELECT COUNT(DISTINCT merchant_id)::int FROM orders WHERE paid_at IS NOT NULL").Scan(&withPaidOrder)
		funnel = append(funnel, gin.H{"stage": "with_paid_order", "count": withPaidOrder})

		api.OK(c, gin.H{"funnel": funnel})
	}
}

func founderFrictionHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var escalations, frustrations, complaints int
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM merchant_events WHERE type = 'escalation_requested'`).Scan(&escalations)
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM merchant_events WHERE type = 'customer_frustrated'`).Scan(&frustrations)
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM reliability_events WHERE type = 'llm_failed'`).Scan(&complaints)

		var failedPayments int
		_ = db.QueryRow(`SELECT COUNT(*)::int FROM reliability_events WHERE type = 'payment_failed'`).Scan(&failedPayments)

		api.OK(c, gin.H{
			"escalations":    escalations,
			"frustrations":   frustrations,
			"failedPayments": failedPayments,
			"llmErrors":      complaints,
		})
	}
}

func founderLatencyHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		latencies, err := platform.GetMerchantLatencies(db)
		if err != nil {
			api.InternalError(c, "failed to get latency data")
			return
		}
		api.OK(c, gin.H{"latency": latencies})
	}
}

func founderPeakHoursHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		hours, err := platform.GetPeakHours(db, "")
		if err != nil {
			api.InternalError(c, "failed to get peak hours")
			return
		}
		api.OK(c, gin.H{"peakHours": hours})
	}
}

func founderTimeseriesHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
			FROM merchants
			WHERE created_at >= NOW() - INTERVAL '90 days'
			GROUP BY day ORDER BY day ASC`)
		if err != nil {
			api.InternalError(c, "failed to query timeseries")
			return
		}
		defer rows.Close()

		type DayCount struct {
			Date  string `json:"date"`
			Count int    `json:"count"`
		}
		var timeseries []DayCount
		for rows.Next() {
			var d DayCount
			if err := rows.Scan(&d.Date, &d.Count); err != nil {
				continue
			}
			timeseries = append(timeseries, d)
		}

		var orderTimeseries []DayCount
		rows2, err := db.Query(`SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
			FROM orders
			WHERE created_at >= NOW() - INTERVAL '90 days'
			GROUP BY day ORDER BY day ASC`)
		if err == nil {
			defer rows2.Close()
			for rows2.Next() {
				var d DayCount
				if err := rows2.Scan(&d.Date, &d.Count); err != nil {
					continue
				}
				orderTimeseries = append(orderTimeseries, d)
			}
		}

		api.OK(c, gin.H{
			"merchants": timeseries,
			"orders":    orderTimeseries,
		})
	}
}

func founderUnitEconomicsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var totalRevenue, totalPaidOrders float64
		_ = db.QueryRow("SELECT COALESCE(SUM(total), 0)::float FROM orders WHERE status = 'CONFIRMED'").Scan(&totalRevenue)
		_ = db.QueryRow("SELECT COUNT(*)::float FROM orders WHERE paid_at IS NOT NULL").Scan(&totalPaidOrders)

		avgOrderValue := 0.0
		if totalPaidOrders > 0 {
			avgOrderValue = totalRevenue / totalPaidOrders
		}

		var totalMerchants int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&totalMerchants)
		revenuePerMerchant := 0.0
		if totalMerchants > 0 {
			revenuePerMerchant = totalRevenue / float64(totalMerchants)
		}

		var totalConversations int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM conversations").Scan(&totalConversations)
		conversionRate := 0.0
		if totalConversations > 0 {
			conversionRate = totalPaidOrders / float64(totalConversations) * 100
		}

		api.OK(c, gin.H{
			"totalRevenue":       totalRevenue,
			"totalPaidOrders":    int(totalPaidOrders),
			"avgOrderValue":      avgOrderValue,
			"revenuePerMerchant": revenuePerMerchant,
			"conversionRate":     conversionRate,
		})
	}
}

func founderDropOffsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		dropOffs, err := platform.GetDropOffs(db, "")
		if err != nil {
			api.InternalError(c, "failed to get drop-off data")
			return
		}

		var totalOrders int
		_ = db.QueryRow("SELECT COUNT(*)::int FROM orders").Scan(&totalOrders)
		for i := range dropOffs {
			if totalOrders > 0 {
				dropOffs[i].Rate = float64(dropOffs[i].Count) / float64(totalOrders) * 100
			}
		}

		api.OK(c, gin.H{"dropOffs": dropOffs})
	}
}

func founderConversationFunnelHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		funnel, err := platform.GetConversationFunnel(db, "")
		if err != nil {
			api.InternalError(c, "failed to get conversation funnel")
			return
		}
		api.OK(c, gin.H{"conversationFunnel": funnel})
	}
}

func founderConversationReplayHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		conversationID := c.Query("conversationId")
		if conversationID == "" {
			api.BadRequest(c, "conversationId is required")
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
			var createdAt interface{}
			if err := rows.Scan(&id, &sender, &body, &createdAt); err != nil {
				continue
			}
			messages = append(messages, gin.H{
				"id": id, "sender": sender, "body": body, "createdAt": createdAt,
			})
		}

		api.OK(c, gin.H{
			"conversationId": conversationID,
			"messages":       messages,
		})
	}
}

func founderReliabilityHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type ReliabilityBucket struct {
			Type  string `json:"type"`
			Count int    `json:"count"`
		}

		rows, err := db.Query(`SELECT type, COUNT(*)::int AS count
			FROM reliability_events
			WHERE created_at >= NOW() - INTERVAL '7 days'
			GROUP BY type ORDER BY count DESC`)
		if err != nil {
			api.InternalError(c, "failed to get reliability data")
			return
		}
		defer rows.Close()

		var buckets []ReliabilityBucket
		for rows.Next() {
			var b ReliabilityBucket
			if err := rows.Scan(&b.Type, &b.Count); err != nil {
				continue
			}
			buckets = append(buckets, b)
		}

		var totalEvents int
		for _, b := range buckets {
			totalEvents += b.Count
		}

		api.OK(c, gin.H{
			"reliability":  buckets,
			"totalEvents":  totalEvents,
			"period":       "7d",
		})
	}
}
