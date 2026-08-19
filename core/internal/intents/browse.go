package intents

import (
	"regexp"
	"strings"
)

var browsePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)^(?:inventory|stock list|product list|price list|your prices|menu|show me everything|show everything)[\s!.?]*$`),
	regexp.MustCompile(`(?i)what you (have|sell|carry|get)`),
	regexp.MustCompile(`(?i)what (do you|y'all|you) (have|sell|carry|get|offer)`),
	regexp.MustCompile(`(?i)(what|which) (products?|items?|goods?) (do you|y'all|you) (have|sell|carry|stock)`),
	regexp.MustCompile(`(?i)show (me )?(your )?(products?|inventory|stock|menu|items?|catalog)`),
	regexp.MustCompile(`(?i)(list|give me|send) (your )?(products?|items?|inventory|stock|menu|catalog|prices)`),
	regexp.MustCompile(`(?i)what (colors|sizes|variants|types|kind) do you (have|sell|carry|get)`),
	regexp.MustCompile(`(?i)(what|which) (category|categories)`),
}

func LooksLikeBrowse(text string) bool {
	normalized := strings.TrimSpace(text)
	for _, re := range browsePatterns {
		if re.MatchString(normalized) {
			return true
		}
	}
	return false
}

func ExtractBrowseCategory(text string) string {
	lower := strings.ToLower(strings.TrimSpace(text))
	categories := []string{"fabric", "clothes", "clothing", "shoes", "phones", "electronics", "accessories", "food", "drinks", "beauty", "health", "home", "garden", "kids", "baby"}
	for _, cat := range categories {
		if strings.Contains(lower, cat) {
			return cat
		}
	}
	return ""
}
