package response

import (
	"fmt"
	"strings"
)

type CatalogItem struct {
	Name        string `json:"name"`
	Price       int    `json:"price"`
	Stock       int    `json:"stock"`
	Category    string `json:"category"`
	Description string `json:"description"`
	IsService   bool   `json:"isService"`
}

func BuildCatalogResponse(items []CatalogItem) string {
	if len(items) == 0 {
		return "I dey here. Wetin you dey find?"
	}

	categories := make(map[string][]CatalogItem)
	for _, item := range items {
		cat := item.Category
		if cat == "" {
			cat = "General"
		}
		categories[cat] = append(categories[cat], item)
	}

	var sb strings.Builder
	sb.WriteString("Here is what we have in stock:\n")

	for cat, catItems := range categories {
		sb.WriteString(fmt.Sprintf("\n*%s:*\n", cat))
		for _, item := range catItems {
			stock := "In stock"
			if item.Stock == 0 {
				stock = "Out of stock"
			}
			sb.WriteString(fmt.Sprintf("- %s: GHS %d (%s)\n", item.Name, item.Price, stock))
		}
	}

	return sb.String()
}

func BuildCategoryList(categories []string) string {
	if len(categories) == 0 {
		return "No categories available."
	}
	return "Available categories:\n- " + strings.Join(categories, "\n- ")
}
