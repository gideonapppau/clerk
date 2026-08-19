package platform

import (
	"database/sql"
	"time"
)

type MerchantReplyLatency struct {
	MerchantID  string        `json:"merchantId"`
	MerchantName string       `json:"merchantName"`
	AverageLatency time.Duration `json:"averageLatency"`
	MedianLatency  time.Duration `json:"medianLatency"`
	SampleSize  int           `json:"sampleSize"`
}

type ReplyLatency struct {
	CustomerMessageTime time.Time `json:"customerMessageTime"`
	MerchantReplyTime   time.Time `json:"merchantReplyTime"`
	Latency             time.Duration `json:"latency"`
}

type ReplyLatencySummary struct {
	Average time.Duration `json:"average"`
	Median  time.Duration `json:"median"`
	P95     time.Duration `json:"p95"`
	Samples int           `json:"samples"`
}

func GetMerchantLatencies(db *sql.DB) ([]MerchantReplyLatency, error) {
	rows, err := db.Query(`SELECT m.id, m.name,
		AVG(EXTRACT(EPOCH FROM (r.created_at - s.created_at)))::float AS avg_latency
		FROM merchants m
		JOIN conversations c ON c.merchant_id = m.id
		JOIN messages s ON s.conversation_id = c.id AND s.sender = 'customer'
		JOIN messages r ON r.conversation_id = c.id AND r.sender = 'merchant'
		WHERE r.created_at > s.created_at
		GROUP BY m.id, m.name
		ORDER BY avg_latency DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []MerchantReplyLatency
	for rows.Next() {
		var r MerchantReplyLatency
		var avgLatency float64
		_ = rows.Scan(&r.MerchantID, &r.MerchantName, &avgLatency)
		r.AverageLatency = time.Duration(avgLatency) * time.Second
		results = append(results, r)
	}
	return results, nil
}
