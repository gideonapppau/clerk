package response

import (
	"github.com/clerk/core/internal/conversations"
)

func IsHumanMode(conversation *conversations.Conversation) bool {
	if conversation == nil {
		return false
	}
	return conversation.Status == "MERCHANT_ENGAGED"
}

func ShouldTakeOver(conversation *conversations.Conversation) bool {
	if conversation == nil {
		return false
	}
	return conversation.Status == "WAITING_MERCHANT"
}
