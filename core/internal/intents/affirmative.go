package intents

import (
	"regexp"
	"strings"
)

var affirmativeRe = regexp.MustCompile(`(?i)^(yes|yeah|yep|yup|sure|ok|okay|confirm|confirmed|proceed|go ahead|absolutely|definitely|done|y|yea)(\s+(please|pls|thanks|thank you))?\.?$`)
var affirmativeContextRe = regexp.MustCompile(`(?i)(yes|confirm|proceed|go ahead|take it|i('ll| will) (take|buy|order|get) (it|this|that)|do it|send (it|the) (link|payment)|process (it|the) order)`)

func LooksLikeAffirmative(text string, context string) bool {
	normalized := strings.TrimSpace(text)
	if affirmativeRe.MatchString(normalized) {
		return true
	}
	if affirmativeContextRe.MatchString(normalized) {
		return true
	}
	if context == "awaiting_order_confirmation" && yesConfirmationRe.MatchString(normalized) {
		return true
	}
	return false
}

func LooksLikeGreeting(text string) bool {
	return greetingRe.MatchString(strings.TrimSpace(text))
}
