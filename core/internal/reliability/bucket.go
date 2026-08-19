package reliability

import (
	"fmt"
)

type BucketType string

const (
	BucketTypeMessageFailed     BucketType = "message_failed"
	BucketTypeWebhookFailed     BucketType = "webhook_failed"
	BucketTypePaymentFailed     BucketType = "payment_failed"
	BucketTypeLLMFailed         BucketType = "llm_failed"
	BucketTypeWhatsAppDown      BucketType = "whatsapp_down"
	BucketTypeConnectionLost    BucketType = "connection_lost"
)

func CaptureEvent(btype BucketType, merchantID, conversationID, messageID, details string) {
	fmt.Printf("reliability: capture failed (type=%s merchant=%s conversation=%s message=%s): %s\n",
		btype, merchantID, conversationID, messageID, details)
}

func CaptureMessageFailed(merchantID, conversationID, messageID string) {
	CaptureEvent(BucketTypeMessageFailed, merchantID, conversationID, messageID, "message delivery failed")
}

func CaptureWebhookFailed(merchantID, conversationID, messageID string) {
	CaptureEvent(BucketTypeWebhookFailed, merchantID, conversationID, messageID, "webhook processing failed")
}

func CapturePaymentFailed(merchantID, conversationID, messageID string) {
	CaptureEvent(BucketTypePaymentFailed, merchantID, conversationID, messageID, "payment processing failed")
}

func CaptureLLMFailed(merchantID, conversationID, messageID string) {
	CaptureEvent(BucketTypeLLMFailed, merchantID, conversationID, messageID, "LLM request failed")
}
