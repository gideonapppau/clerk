package intents

import (
	"regexp"
	"strings"
	"unicode"
)

var (
	noncePattern     = regexp.MustCompile(`(?i)ignore\s+(all\s+)?previous\s+instructions`)
	systemPromptPat  = regexp.MustCompile(`(?i)new\s+system\s+prompt`)
	ownerClaims      = regexp.MustCompile(`(?i)i\s+(am|'m)\s+the\s+(shop\s+)?owner`)
	adminClaims      = regexp.MustCompile(`(?i)i\s+(am|'m)\s+the\s+(shop\s+)?admin`)
	roleInjection    = regexp.MustCompile(`(?i)(you\s+are\s+now|act\s+as|pretend\s+(to\s+be)|from\s+now\s+on)`)
	boundaryPush     = regexp.MustCompile(`(?i)(forget|disregard|override)\s+(your\s+)?(rules|instructions|prompt)`)
	encodingEvade    = regexp.MustCompile(`(?i)(base64|rot13|decode|unscramble)`)
	contextWindow    = regexp.MustCompile(`(?i)(system\s+message|context\s+window|chat\s+history)`)
	contentInjection = regexp.MustCompile(`(?i)(</?system>|<</?s>>|\[system\])`)
	namespace        = regexp.MustCompile(`(?i)(assistant|system|user)\s*:`)
)

func LooksLikePromptInjection(text string) bool {
	if systemPromptPat.MatchString(text) ||
		ownerClaims.MatchString(text) ||
		adminClaims.MatchString(text) ||
		noncePattern.MatchString(text) ||
		roleInjection.MatchString(text) ||
		boundaryPush.MatchString(text) ||
		encodingEvade.MatchString(text) ||
		contextWindow.MatchString(text) ||
		contentInjection.MatchString(text) ||
		namespace.MatchString(text) {
		return true
	}

	words := strings.Fields(text)
	if len(words) > 5 {
		capsCount := 0
		for _, w := range words {
			allCaps := true
			for _, r := range w {
				if unicode.IsLetter(r) && unicode.IsLower(r) {
					allCaps = false
					break
				}
			}
			if allCaps && len(w) > 2 {
				capsCount++
			}
		}
		if capsCount > len(words)/2 {
			return true
		}
	}
	return false
}
