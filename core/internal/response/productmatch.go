package response

import (
	"fmt"
)

type ProductMatch struct {
	ProductName string `json:"productName"`
	Price       int    `json:"price"`
	Stock       int    `json:"stock"`
	Score       float64 `json:"score"`
}

func RankProducts(query string, products []ProductMatch) []ProductMatch {
	for i := range products {
		products[i].Score = calculateMatchScore(query, products[i].ProductName)
	}

	for i := 0; i < len(products); i++ {
		for j := i + 1; j < len(products); j++ {
			if products[j].Score > products[i].Score {
				products[i], products[j] = products[j], products[i]
			}
		}
	}
	return products
}

func calculateMatchScore(query, productName string) float64 {
	query = toLower(query)
	productName = toLower(productName)

	if query == productName {
		return 1.0
	}
	if contains(productName, query) {
		return 0.8
	}
	if contains(query, productName) {
		return 0.7
	}

	sharedWords := 0
	queryWords := splitWords(query)
	productWords := splitWords(productName)
	for _, qw := range queryWords {
		for _, pw := range productWords {
			if qw == pw {
				sharedWords++
			}
		}
	}
	if len(queryWords) > 0 {
		return float64(sharedWords) / float64(len(queryWords)) * 0.6
	}
	return 0
}

func MatchResponse(match ProductMatch, exact bool) string {
	if exact {
		return fmt.Sprintf("Still have %s. Would you like to proceed with this order?", match.ProductName)
	}
	return fmt.Sprintf("Found: %s at GHS %d. Still available.", match.ProductName, match.Price)
}

func toLower(s string) string {
	result := make([]rune, len(s))
	for i, r := range s {
		if r >= 'A' && r <= 'Z' {
			result[i] = r + 32
		} else {
			result[i] = r
		}
	}
	return string(result)
}

func contains(s, substr string) bool {
	return len(substr) > 0 && len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstring(s, substr))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func splitWords(s string) []string {
	var words []string
	current := ""
	for _, r := range s {
		if r == ' ' || r == ',' || r == '.' || r == '?' || r == '!' {
			if current != "" {
				words = append(words, current)
				current = ""
			}
		} else {
			current += string(r)
		}
	}
	if current != "" {
		words = append(words, current)
	}
	return words
}
