package intents

import (
	"regexp"
	"strings"
)

var complaintRe = regexp.MustCompile(`(?i)(the product i received is wrong|it's not working|i want a refund|this is not what i ordered|complaint|wrong product|defective|broken|damaged|refund|return)`)
var frustrationRe = regexp.MustCompile(`(?i)frustrated|frustrating|annoying|annoyed|angry|unhappy|dissatisfied|disappointed|terrible|awful|horrible|worst|useless|waste of time|waste of money`)

func LooksLikeEscalation(text string) bool {
	normalized := strings.TrimSpace(text)
	return humanEscalationRe.MatchString(normalized)
}

func LooksLikeComplaint(text string) bool {
	return complaintRe.MatchString(strings.TrimSpace(text))
}

func LooksLikeFrustration(text string) bool {
	return frustrationRe.MatchString(strings.TrimSpace(text))
}
