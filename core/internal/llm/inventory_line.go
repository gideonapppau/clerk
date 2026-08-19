package llm

import (
	"fmt"
	"strings"
)

type InventoryLine struct {
	Name     string `json:"name"`
	Price    int    `json:"price"`
	Stock    int    `json:"stock"`
	Category string `json:"category"`
}

func FormatInventoryForPrompt(items []InventoryLine) string {
	if len(items) == 0 {
		return "No products available."
	}
	var sb strings.Builder
	limit := MaxInventoryItems
	if len(items) < limit {
		limit = len(items)
	}
	for _, item := range items[:limit] {
		stock := "In stock"
		if item.Stock == 0 {
			stock = "Out of stock"
		}
		sb.WriteString(fmt.Sprintf("- %s: GHS %d (%s)\n", item.Name, item.Price, stock))
	}
	if len(items) > MaxInventoryItems {
		sb.WriteString(fmt.Sprintf("...and %d more items\n", len(items)-MaxInventoryItems))
	}
	return sb.String()
}

func FilterByCategory(items []InventoryLine, category string) []InventoryLine {
	if category == "" {
		return items
	}
	var filtered []InventoryLine
	for _, item := range items {
		if strings.EqualFold(item.Category, category) {
			filtered = append(filtered, item)
		}
	}
	return filtered
}
