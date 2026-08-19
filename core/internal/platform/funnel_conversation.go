package platform

import (
	"database/sql"
)

type ConversationFunnel struct {
	Stage string `json:"stage"`
	Count int    `json:"count"`
}

func GetConversationFunnel(db *sql.DB, merchantID string) ([]ConversationFunnel, error) {
	rows, err := db.Query(`SELECT status, COUNT(*)::int FROM conversations WHERE merchant_id = $1 GROUP BY status ORDER BY COUNT(*) DESC`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var funnel []ConversationFunnel
	for rows.Next() {
		var f ConversationFunnel
		_ = rows.Scan(&f.Stage, &f.Count)
		funnel = append(funnel, f)
	}
	return funnel, nil
}
