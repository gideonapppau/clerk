package platform

import (
	"database/sql"
)

type PeakHour struct {
	Hour  int `json:"hour"`
	Count int `json:"count"`
}

func GetPeakHours(db *sql.DB, merchantID string) ([]PeakHour, error) {
	rows, err := db.Query(`SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::int AS hour, COUNT(*)::int
		FROM messages m JOIN conversations c ON m.conversation_id = c.id
		WHERE c.merchant_id = $1 AND m.sender = 'customer'
		GROUP BY hour ORDER BY count DESC`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var hours []PeakHour
	for rows.Next() {
		var h PeakHour
		_ = rows.Scan(&h.Hour, &h.Count)
		hours = append(hours, h)
	}
	return hours, nil
}
