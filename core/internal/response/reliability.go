package response

import (
	"database/sql"
	"fmt"
)

func CheckReliability(db *sql.DB, merchantID string) bool {
	var autoReplyCount int
	_ = db.QueryRow(`SELECT COUNT(*)::int FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		WHERE c.merchant_id = $1 AND m.sender = 'bot' AND m.created_at >= NOW() - INTERVAL '24 hours'`, merchantID).Scan(&autoReplyCount)
	return autoReplyCount < MaxAutoReplies()
}

func HandleReliabilityLimit(db *sql.DB, merchantID string) string {
	_, _ = db.Exec(`UPDATE merchants SET auto_reply_limited = true, updated_at = NOW() WHERE id = $1`, merchantID)
	return ReachedLimitMessage
}

func GetReliabilityStatus(db *sql.DB, merchantID string) (int, bool) {
	var count int
	_ = db.QueryRow(`SELECT COUNT(*)::int FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		WHERE c.merchant_id = $1 AND m.sender = 'bot' AND m.created_at >= NOW() - INTERVAL '24 hours'`, merchantID).Scan(&count)
	return count, count < MaxAutoReplies()
}

func ReliabilityCheckPassed(db *sql.DB, merchantID string) bool {
	_, ok := GetReliabilityStatus(db, merchantID)
	return ok
}

func FormatReliabilityAlert(merchantID string, count int) string {
	return fmt.Sprintf("Clerk: Your automated reply limit was reached. Upgrade in the dashboard or reply on WhatsApp.")
}
