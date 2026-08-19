package llm

import (
	"fmt"
)

func BuildBrowsePrompt(inventory []string, merchantName string) string {
	prompt := fmt.Sprintf(`You are %s's shop assistant on WhatsApp. The customer wants to browse products.

Available products:
%s

Provide a brief, friendly list of available products. Use Ghanaian English (Pidgin) where natural.
Keep it short and helpful.`, merchantName, formatInventoryList(inventory))
	return prompt
}

func formatInventoryList(items []string) string {
	result := ""
	limit := MaxInventoryItems
	if len(items) < limit {
		limit = len(items)
	}
	for i := 0; i < limit; i++ {
		result += fmt.Sprintf("%d. %s\n", i+1, items[i])
	}
	if len(items) > MaxInventoryItems {
		result += fmt.Sprintf("...and %d more items\n", len(items)-MaxInventoryItems)
	}
	return result
}
