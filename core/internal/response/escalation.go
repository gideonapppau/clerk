package response

import (
	"fmt"
)

const (
	EscalationMessage         = "Let me connect you to a member of our team to help you with that."
	EscalationToHumanPrompt   = "Reply and confirm their request"
	FrustrationMessage        = "A customer seems frustrated on WhatsApp."
	EscalationAlertMessage    = "Clerk: A customer on WhatsApp asked to speak with you. Open your Clerk dashboard to reply."
	NegotiationAlertMessage   = "Clerk: A customer wants to negotiate price on WhatsApp. Check your Clerk dashboard."
	OrderFailedAlertMessage   = "Clerk: Your automated reply limit was reached. Upgrade in the dashboard or reply on WhatsApp."
	CustomerOrderFailed       = "A customer order could not be completed."
	ReachedLimitMessage       = "We couldn't process this order automatically. Let me get someone from our team to assist you shortly."
)

func BuildEscalationReply(reason string) string {
	switch reason {
	case "frustration":
		return FrustrationMessage
	case "negotiation":
		return NegotiationAlertMessage
	default:
		return EscalationMessage
	}
}

func BuildEscalationAlert(reason, merchantPhone string) string {
	switch reason {
	case "frustration":
		return FrustrationMessage
	case "order_failed":
		return CustomerOrderFailed
	default:
		return fmt.Sprintf("Clerk: A customer on WhatsApp asked to speak with you. Open your Clerk dashboard to reply.")
	}
}
