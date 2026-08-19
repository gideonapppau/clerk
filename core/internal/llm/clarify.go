package llm

import (
	"fmt"
	"strings"
)

func BuildClarifyPrompt(text string, context []ConversationTurn) string {
	var sb strings.Builder
	sb.WriteString("The customer sent a message that needs clarification.\n\n")
	sb.WriteString(fmt.Sprintf("Customer message: %q\n\n", TruncateMessage(text, MaxMessageLength)))
	if len(context) > 0 {
		sb.WriteString("Recent conversation:\n")
		for _, turn := range TrimTurnsForPrompt(context, 3) {
			sb.WriteString(fmt.Sprintf("%s: %s\n", turn.Role, TruncateMessage(turn.Content, 200)))
		}
		sb.WriteString("\n")
	}
	sb.WriteString("Ask the customer to clarify what they're looking for. Be friendly and use Ghanaian English.\nKeep it short.")
	return sb.String()
}

func BuildFollowupPrompt(conversationID string, lastAction string, context []ConversationTurn) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Follow up on the conversation. Last action: %s.\n", lastAction))
	if len(context) > 0 {
		sb.WriteString("\nRecent context:\n")
		for _, turn := range TrimTurnsForPrompt(context, 3) {
			sb.WriteString(fmt.Sprintf("%s: %s\n", turn.Role, TruncateMessage(turn.Content, 200)))
		}
	}
	sb.WriteString("\nKeep it brief and friendly. Use Ghanaian Pidgin where natural.")
	return sb.String()
}
