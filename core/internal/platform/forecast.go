package platform

import (
	"database/sql"
)

type ForecastData struct {
	Date   string  `json:"date"`
	Value  float64 `json:"value"`
	Type   string  `json:"type"`
}

func GetForecast(db *sql.DB, days int) ([]ForecastData, error) {
	rows, err := db.Query(`SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::float
		FROM orders WHERE created_at >= NOW() - $1
		GROUP BY day ORDER BY day`, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var data []ForecastData
	for rows.Next() {
		var d ForecastData
		var count float64
		_ = rows.Scan(&d.Date, &count)
		d.Value = count
		d.Type = "orders"
		data = append(data, d)
	}
	return data, nil
}
