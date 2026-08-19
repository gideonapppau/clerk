package intents

import (
	"regexp"
	"strings"
)

var conversationAckRe = regexp.MustCompile(`(?i)^(okay thanks|bye|good night|noted thanks|i('ll| will) come back later|thanks|thank you|alright|okay|ok)\s*\.?$`)

func LooksLikeConversationAck(text string) bool {
	return conversationAckRe.MatchString(strings.TrimSpace(text))
}
