package llm

import (
	"strings"
)

func ToPidgin(standardEnglish string) string {
	replacements := map[string]string{
		"Hello":            "Hey",
		"Hi":               "Hey",
		"How are you":      "How far",
		"Thank you":        "Thank you",
		"Please":           "Abeg",
		"Okay":             "Okay",
		"Yes":              "Yeah",
		"No":               "No",
		"What do you want": "Wetin you dey find",
		"I have":           "I get",
		"Do you have":      "You get",
		"Right now":        "Now now",
		"Later":            "Later",
	}
	result := standardEnglish
	for en, pidgin := range replacements {
		result = strings.ReplaceAll(result, en, pidgin)
	}
	return result
}

func IsPidginLikely(text string) bool {
	pidginMarkers := []string{"dey", "wetin", "abeg", "na", "no wahala", "fit", "e be", "sɛ", "ɛyɛ", "ka"}
	lower := strings.ToLower(text)
	for _, marker := range pidginMarkers {
		if strings.Contains(lower, marker) {
			return true
		}
	}
	return false
}
