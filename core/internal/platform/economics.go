package platform

import (
	"database/sql"
)

type DropOffOrder struct {
	Stage       string  `json:"stage"`
	Count       int     `json:"count"`
	Rate        float64 `json:"rate"`
}

func GetDropOffs(db *sql.DB, merchantID string) ([]DropOffOrder, error) {
	rows, err := db.Query(`SELECT status, COUNT(*)::int FROM orders WHERE merchant_id = $1 GROUP BY status ORDER BY COUNT(*) DESC`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var dropOffs []DropOffOrder
	for rows.Next() {
		var d DropOffOrder
		_ = rows.Scan(&d.Stage, &d.Count)
		dropOffs = append(dropOffs, d)
	}
	return dropOffs, nil
}
