package conversations

import (
	"fmt"
	"strings"

	"github.com/clerk/core/internal/commerce"
	"github.com/clerk/core/internal/intents"
)

func (m *Manager) SimulateMessage(merchantID, customerPhone, text string) (*HandleResult, error) {
	return m.HandleMessage(merchantID, customerPhone, text)
}

func (m *Manager) SimulateFlow(merchantID, customerPhone string, messages []string) ([]HandleResult, error) {
	var results []HandleResult
	for _, msg := range messages {
		result, err := m.HandleMessage(merchantID, customerPhone, msg)
		if err != nil {
			return results, err
		}
		results = append(results, *result)
	}
	return results, nil
}

func (m *Manager) SimulateConversation(merchantID string, scenario []struct{ Role, Text string }) ([]HandleResult, error) {
	var results []HandleResult
	for _, turn := range scenario {
		if strings.ToLower(turn.Role) == "customer" {
			result, err := m.HandleMessage(merchantID, "+1000000000", turn.Text)
			if err != nil {
				return results, err
			}
			results = append(results, *result)
		}
	}
	return results, nil
}

func SimulateIntentClassification(text string) string {
	return intents.Classify(text)
}

func SimulateProductMatch(merchantID, term string) []commerce.InventoryMatch {
	repo := commerce.NewInventoryRepo(nil)
	matches, _ := repo.FindByFuzzy(merchantID, term)
	return matches
}

func SimulateResponse(intent, productName string) string {
	switch intent {
	case intents.IntentBrowseCategory:
		return "Here is what we have in stock:"
	case intents.IntentOrder:
		if productName != "" {
			return fmt.Sprintf("Still have %s. Would you like to proceed with this order?", productName)
		}
		return "I no catch that well. Abeg send the exact item name."
	case intents.IntentPriceNegotiation:
		return "The price dey fixed. I go connect you to the seller if you want talk about am."
	case intents.IntentRequestedHuman:
		return "Let me connect you to a member of our team to help you with that."
	default:
		return "I no catch that well. Abeg send the exact item name."
	}
}
