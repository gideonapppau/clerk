package intents

import (
	"regexp"
	"strings"
)

var gibberishRe = regexp.MustCompile(`^[a-zA-Z]{20,}$`)
var repeatedCharRe = regexp.MustCompile(`(.)\1{4,}`)

func LooksLikeGibberish(text string) bool {
	normalized := strings.TrimSpace(text)
	if len(normalized) < 3 {
		return true
	}
	if gibberishRe.MatchString(normalized) {
		return true
	}
	if repeatedCharRe.MatchString(normalized) {
		return true
	}
	hasLetters := false
	for _, r := range normalized {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
			hasLetters = true
			break
		}
	}
	if !hasLetters && len(normalized) > 5 {
		return true
	}
	return false
}
