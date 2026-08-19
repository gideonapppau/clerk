package llm

const (
	MaxPromptLength   = 4096
	MaxContextTurns   = 10
	MaxInventoryItems = 15
	MaxMessageLength  = 500
	MaxHistoryMessages = 20
	MaxTurnsInContext = 10
)

func TrimTurnsForPrompt(turns []ConversationTurn, maxTurns int) []ConversationTurn {
	if maxTurns <= 0 {
		maxTurns = MaxContextTurns
	}
	if len(turns) <= maxTurns {
		return turns
	}
	return turns[len(turns)-maxTurns:]
}

func TruncateMessage(msg string, maxLen int) string {
	if maxLen <= 0 {
		maxLen = MaxMessageLength
	}
	if len(msg) <= maxLen {
		return msg
	}
	return msg[:maxLen-3] + "..."
}
