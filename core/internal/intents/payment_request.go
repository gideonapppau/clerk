package intents

import (
	"regexp"
	"strings"
)

var paymentFollowupRe = regexp.MustCompile(`(?i)(pay|payment|momo|mobile money|how (do|to) pay|send (the )?link|where (do|can) i pay|pay now|pay for (the )?order|checkout|link|mpesa|telecel|vodafone|mtn)`)

func LooksLikePaymentFollowup(text string) bool {
	return paymentFollowupRe.MatchString(strings.TrimSpace(text))
}
