package intents

import (
	"regexp"
	"strings"
)

var orderCorrectionRe = regexp.MustCompile(`(?i)^(?:i\s+said|i\s+meant|not\s+that,?\s*)\s+(.+)$`)
var orderRepetitionRe = regexp.MustCompile(`(?i)(i want to order another one|same thing i bought last time|can i get the same order again|another one|one more|same again|repeat (the )?order|reorder|order (the )?same)`)

func LooksLikeOrderCorrection(text string) bool {
	return orderCorrectionRe.MatchString(strings.TrimSpace(text))
}

func ExtractCorrection(text string) string {
	match := orderCorrectionRe.FindStringSubmatch(strings.TrimSpace(text))
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return text
}

func LooksLikeOrderRepetition(text string) bool {
	return orderRepetitionRe.MatchString(strings.TrimSpace(text))
}
