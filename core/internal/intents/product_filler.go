package intents

import (
	"regexp"
	"strings"
)

var productRequestRe = regexp.MustCompile(`(?i)(buy|order|want|need|get me|can i get|i('ll| will) take|looking for|do you have|i need|gimme|give me|I want to order)`)
var whatAboutRe = regexp.MustCompile(`(?i)^(?:what|how) about (?:the )?(.+?)\??$`)
var colorSizeRe = regexp.MustCompile(`(?i)what (colors|sizes|variants|types|kind) do you (have|sell|carry|get)`)

func LooksLikeProductRequest(text string) bool {
	normalized := strings.TrimSpace(text)
	return productRequestRe.MatchString(normalized)
}

func ExtractProductName(text string) string {
	cleaned := productRequestRe.ReplaceAllString(text, "")
	cleaned = strings.TrimSpace(cleaned)
	if cleaned == "" {
		return text
	}
	return cleaned
}

func ExtractCategoryAndProduct(text string) (category, productName string) {
	lower := strings.ToLower(strings.TrimSpace(text))

	categoryPatterns := map[string][]string{
		"phones":      {"phone", "iphone", "samsung", "android", "smartphone"},
		"fabric":      {"fabric", "cloth", "material", "textile"},
		"clothes":     {"shirt", "dress", "pants", "trousers", "shorts", "skirt", "top", "blouse"},
		"shoes":       {"shoe", "sneaker", "boot", "sandal", "slipper"},
		"electronics": {"laptop", "tablet", "headphone", "charger", "cable", "speaker"},
		"accessories": {"bag", "watch", "jewelry", "ring", "necklace", "bracelet"},
		"beauty":      {"cream", "lotion", "makeup", "perfume", "soap", "shampoo"},
		"food":        {"rice", "beans", "bread", "meat", "fish", "vegetable", "fruit"},
	}

	for cat, keywords := range categoryPatterns {
		for _, kw := range keywords {
			if strings.Contains(lower, kw) {
				productName = strings.TrimSpace(text)
				category = cat
				return
			}
		}
	}

	if match := orderIntentRe.FindStringSubmatch(text); len(match) > 0 {
		cleaned := orderIntentRe.ReplaceAllString(text, "")
		cleaned = strings.TrimSpace(cleaned)
		productName = cleaned
	}

	return
}

var orderIntentFilterRe = regexp.MustCompile(`(?i)(?:I want to order|buy|order|want|need|get me|can i get|i('ll| will) take|looking for)\s*`)

func IsOrderIntent(text string) bool {
	return orderIntentFilterRe.MatchString(strings.TrimSpace(text))
}
