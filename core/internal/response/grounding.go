package response

import (
	"fmt"

	"github.com/clerk/core/internal/commerce"
	"github.com/clerk/core/internal/intents"
)

func BuildGroundingResponse(text, merchantScope string) string {
	if intents.IsGroundingViolation(text, merchantScope) {
		return fmt.Sprintf("I can only help with %s. Please ask me for a product or category from this shop.", merchantScope)
	}
	return ""
}

func CheckScope(text, merchantScope string) bool {
	if merchantScope == "" {
		return true
	}
	return !intents.IsGroundingViolation(text, merchantScope)
}

func MatchInventoryToQuery(query string, items []commerce.InventoryMatch) []commerce.InventoryMatch {
	if len(items) == 0 {
		return nil
	}
	var matched []commerce.InventoryMatch
	for _, item := range items {
		matched = append(matched, item)
	}
	return matched
}
