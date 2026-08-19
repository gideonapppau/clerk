package response

import (
	"fmt"
	"strings"

	"github.com/clerk/core/internal/intents"
)

type ConversationContext struct {
	MerchantName    string
	ProductName     string
	CustomerPhone   string
	ConversationID  string
	LastIntent      string
	State           string
	InventoryItems  []string
	OrderID         string
	IsNegotiation   bool
	PaymentURL      string
}

func BuildReply(ctx ConversationContext, incomingText string) string {
	intent := intents.Classify(incomingText)

	switch intent {
	case "greeting":
		return buildGreeting(ctx)
	case intents.IntentBrowseCategory:
		return buildBrowseReply(ctx)
	case intents.IntentOrder:
		return buildOrderReply(ctx)
	case "price_query":
		return buildPriceReply(ctx)
	case intents.IntentPriceNegotiation:
		return buildNegotiateReply(ctx)
	case intents.IntentCheckoutConfirm:
		return buildCheckoutReply(ctx)
	case intents.IntentPaymentFollowup:
		return buildPaymentReply(ctx)
	case intents.IntentRequestedHuman:
		return buildEscalationReply(ctx)
	case intents.IntentOrderCorrection:
		return buildCorrectionReply(ctx)
	case "stop_replying":
		return buildStopReply(ctx)
	case "anything_else":
		return buildAnythingElse(ctx)
	case intents.IntentCheckStock:
		return buildStockCheckReply(ctx)
	default:
		return buildDefaultReply(ctx)
	}
}

func buildGreeting(ctx ConversationContext) string {
	greetings := []string{
		"Good afternoon! Wetin you dey find?",
		"Hey! Wetin I fit get for you today?",
		"Hi! What are you looking for today?",
		"I dey here! Wetin you dey find?",
		"I dey! Wetin I fit get for you?",
		"Still here! Wetin you dey find?",
		"Good evening! Wetin I fit get for you?",
		"Morning! I dey here. Wetin you dey find?",
	}
	idx := 0
	if ctx.CustomerPhone != "" {
		sum := 0
		for _, c := range ctx.CustomerPhone {
			sum += int(c)
		}
		idx = sum % len(greetings)
	}
	return greetings[idx]
}

func buildBrowseReply(ctx ConversationContext) string {
	if len(ctx.InventoryItems) == 0 {
		return "I dey here. Wetin you dey find?"
	}
	return "Here is what we have in stock:"
}

func buildOrderReply(ctx ConversationContext) string {
	if ctx.ProductName != "" {
		return fmt.Sprintf("Let me process that order for you now.")
	}
	return "I no catch that well. Abeg send the exact item name."
}

func buildPriceReply(ctx ConversationContext) string {
	return "Send the exact item name."
}

func buildNegotiateReply(ctx ConversationContext) string {
	if ctx.ProductName != "" {
		return "The price dey fixed. I go connect you to the seller if you want talk about am."
	}
	return "The price dey fixed. I go connect you to the seller if you want talk about am."
}

func buildCheckoutReply(ctx ConversationContext) string {
	return "Nice one. We go check the payment and confirm am shortly."
}

func buildPaymentReply(ctx ConversationContext) string {
	return "Sorry for the delay. Sending your payment link now."
}

func buildEscalationReply(ctx ConversationContext) string {
	return "Let me connect you to a member of our team to help you with that."
}

func buildCorrectionReply(ctx ConversationContext) string {
	return "I no catch that well. Abeg send the exact item name."
}

func buildStopReply(ctx ConversationContext) string {
	return "No wahala! If you need anything else, just holla."
}

func buildAnythingElse(ctx ConversationContext) string {
	return "No problem. Let me know if there's anything else you need."
}

func buildStockCheckReply(ctx ConversationContext) string {
	if ctx.ProductName != "" {
		return fmt.Sprintf("Still have %s. Would you like to proceed with this order?", ctx.ProductName)
	}
	return "Send the exact item name."
}

func buildDefaultReply(ctx ConversationContext) string {
	return "I no catch that well. Abeg send the exact item name."
}

func FormatProductList(products []string) string {
	if len(products) == 0 {
		return "No products available."
	}
	return "Here is what we have in stock:\n" + strings.Join(products, "\n- ")
}

func OutOfStockMessage(productName string) string {
	return fmt.Sprintf("We're out of *%s*, and nothing else is in stock right now.", productName)
}

func NoStockMessage(productName string) string {
	return fmt.Sprintf("Customer asking about *%s* no dey stock.", productName)
}
