package payment

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

func StartRecoveryWorker(db *sql.DB, interval, delay time.Duration) {
	log.Printf("payment recovery worker started (every %s, delay %s)", interval, delay)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		processRecovery(db, delay)
	}
}

func processRecovery(db *sql.DB, delay time.Duration) {
	rows, err := db.Query(`SELECT id, merchant_id, payment_reference, payment_provider FROM orders
		WHERE status = 'PENDING_CONFIRMATION' AND created_at < NOW() - $1::interval
		LIMIT 50`, fmt.Sprintf("%d seconds", int(delay.Seconds())))
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var orderID, merchantID, reference, provider string
		_ = rows.Scan(&orderID, &merchantID, &reference, &provider)
		if reference == "" {
			continue
		}
		if provider == "" {
			provider = "paystack"
		}
		svc := NewService(db)
		verified, _ := svc.VerifyPayment(provider, reference)
		if verified {
			_, _ = db.Exec("UPDATE orders SET status = 'CONFIRMED', paid_at = NOW(), updated_at = NOW() WHERE id = $1", orderID)
		}
	}
}
