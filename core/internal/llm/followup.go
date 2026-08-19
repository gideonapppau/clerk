package llm

import (
	"fmt"
)

func BuildFollowUpResponse(conversationHistory []ConversationTurn, lastProduct string) string {
	prompt := fmt.Sprintf(`The customer previously asked about %s. Generate a natural follow-up message asking if they need anything else.
Keep it short, friendly, and natural. Use Ghanaian English where appropriate.`, lastProduct)
	return prompt
}

func BuildStockCheckResponse(productName string, inStock bool) string {
	if inStock {
		return fmt.Sprintf("Still have %s. Would you like to proceed with this order?", productName)
	}
	return fmt.Sprintf("We don't have *%s* anymore. No problem. Which item you want instead?", productName)
}
