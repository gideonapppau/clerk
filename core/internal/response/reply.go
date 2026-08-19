package response

import (
	"fmt"

	"github.com/clerk/core/internal/intents"
)

func GenerateReply(intent, text string, inventory []string, merchantName string) string {
	switch intent {
	case "greeting":
		return "Good afternoon! Wetin you dey find?"
	case intents.IntentBrowseCategory:
		return "Here is what we have in stock:"
	case intents.IntentOrder:
		return "Let me process that order for you now."
	case "price_query":
		return "Send the exact item name."
	case intents.IntentPriceNegotiation:
		return "The price dey fixed. I go connect you to the seller if you want talk about am."
	case intents.IntentCheckoutConfirm:
		return "Nice one. We go check the payment and confirm am shortly."
	case intents.IntentPaymentFollowup:
		return "Sorry for the delay. Sending your payment link now."
	case intents.IntentRequestedHuman:
		return "Let me connect you to a member of our team to help you with that."
	case intents.IntentOrderCorrection:
		return "I no catch that well. Abeg send the exact item name."
	case "stop_replying":
		return "No wahala! If you need anything else, just holla."
	case intents.IntentCheckStock:
		return "Send the exact item name."
	case intents.IntentPromptInjection:
		return fmt.Sprintf("I can only help with product inquiries. Please ask me for a product or category from this shop.")
	default:
		return "I no catch that well. Abeg send the exact item name."
	}
}

func ReplyToText(text, merchantName string, inventory []string) string {
	intent := intents.Classify(text)
	return GenerateReply(intent, text, inventory, merchantName)
}
