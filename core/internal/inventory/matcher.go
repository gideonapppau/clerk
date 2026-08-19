package inventory

import (
	"strings"
)

type MatchResult struct {
	ProductName string  `json:"productName"`
	Price       int     `json:"price"`
	Stock       int     `json:"stock"`
	Score       float64 `json:"score"`
}

func FuzzyMatch(query string, items []MatchResult) []MatchResult {
	query = strings.ToLower(strings.TrimSpace(query))
	for i := range items {
		name := strings.ToLower(items[i].ProductName)
		if name == query {
			items[i].Score = 1.0
		} else if strings.Contains(name, query) {
			items[i].Score = 0.8
		} else if strings.Contains(query, name) {
			items[i].Score = 0.7
		} else {
			sharedWords := countSharedWords(query, name)
			items[i].Score = float64(sharedWords) * 0.3
		}
	}

	for i := 0; i < len(items); i++ {
		for j := i + 1; j < len(items); j++ {
			if items[j].Score > items[i].Score {
				items[i], items[j] = items[j], items[i]
			}
		}
	}
	return items
}

func countSharedWords(a, b string) int {
	aWords := strings.Fields(a)
	bWords := strings.Fields(b)
	shared := 0
	for _, aw := range aWords {
		for _, bw := range bWords {
			if aw == bw {
				shared++
			}
		}
	}
	return shared
}

func ExtractTerms(text string) []string {
	words := strings.Fields(strings.ToLower(text))
	stopWords := map[string]bool{"i": true, "want": true, "to": true, "buy": true, "order": true, "need": true, "get": true, "me": true, "can": true, "you": true, "have": true, "do": true, "the": true, "a": true, "an": true, "is": true, "are": true}
	var terms []string
	for _, w := range words {
		if !stopWords[w] && len(w) > 1 {
			terms = append(terms, w)
		}
	}
	return terms
}
