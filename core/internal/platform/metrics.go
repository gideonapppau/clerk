package platform

import (
	"database/sql"
)

type Metrics struct {
	TotalMerchants    int     `json:"totalMerchants"`
	LiveMerchants     int     `json:"liveMerchants"`
	TotalConversations int    `json:"totalConversations"`
	TotalOrders       int     `json:"totalOrders"`
	TotalRevenue      float64 `json:"totalRevenue"`
	ConversionRate    float64 `json:"conversionRate"`
}

func GetMetrics(db *sql.DB) (*Metrics, error) {
	m := &Metrics{}
	_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&m.TotalMerchants)
	_ = db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE connected = true").Scan(&m.LiveMerchants)
	_ = db.QueryRow("SELECT COUNT(*)::int FROM conversations").Scan(&m.TotalConversations)
	_ = db.QueryRow("SELECT COUNT(*)::int FROM orders").Scan(&m.TotalOrders)
	_ = db.QueryRow("SELECT COALESCE(SUM(total), 0)::float FROM orders WHERE status = 'CONFIRMED'").Scan(&m.TotalRevenue)
	return m, nil
}
