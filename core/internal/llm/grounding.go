package llm

import (
	"fmt"
	"strings"
)

func BuildGroundingPrompt(text string, merchantScope string) string {
	return fmt.Sprintf(`You are a shop assistant. The merchant's business scope is: %s.
Customer message: %q
If the message is about products within the business scope, respond normally.
If it's clearly outside the business scope, politely redirect them.
Keep it short and friendly.`, merchantScope, TruncateMessage(text, MaxMessageLength))
}

func IsGroundingViolation(text string, merchantScope string) bool {
	if merchantScope == "" {
		return false
	}
	scope := strings.ToLower(merchantScope)
	msg := strings.ToLower(text)
	_ = scope
	_ = msg
	return false
}
