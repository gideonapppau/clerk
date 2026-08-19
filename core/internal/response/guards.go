package response

import (
	"github.com/clerk/core/internal/intents"
)

func ShouldEscalate(intent string, confidence float64) bool {
	if intent == intents.IntentRequestedHuman {
		return true
	}
	if intent == intents.IntentPromptInjection {
		return true
	}
	return false
}

func ShouldBlockResponse(intent string) bool {
	return intent == intents.IntentPromptInjection
}

func ShouldSendToMerchant(intent string) bool {
	return intent == intents.IntentRequestedHuman || intent == intents.IntentPriceNegotiation
}

func MaxAutoReplies() int {
	return 100
}
