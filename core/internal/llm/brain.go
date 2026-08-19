package llm

import (
	"fmt"
)

type Brain struct {
	client *Client
	config *Config
}

func NewBrain(config *Config) *Brain {
	client := NewClient(config)
	return &Brain{
		client: client,
		config: config,
	}
}

func (b *Brain) Classify(text string, context []ConversationTurn) (*IntentClassification, error) {
	prompt := BuildClassifierPrompt(text, context)
	resp, err := b.client.Chat(prompt, "You are a message classifier for a WhatsApp shop assistant called Clerk.")
	if err != nil {
		return nil, fmt.Errorf("brain classify: %w", err)
	}
	classification, err := ParseClassification(resp)
	if err != nil {
		return nil, fmt.Errorf("brain parse: %w", err)
	}
	return classification, nil
}

func (b *Brain) GenerateReply(text string, context []ConversationTurn, inventory []string, merchantName string) (string, error) {
	prompt := BuildReplyPrompt(text, context, inventory, merchantName)
	resp, err := b.client.Chat(prompt, "You are a helpful WhatsApp shop assistant for a Ghanaian merchant called "+merchantName+".")
	if err != nil {
		return "", fmt.Errorf("brain reply: %w", err)
	}
	return resp, nil
}

func (b *Brain) Negotiate(text string, productName string, currentPrice int) (string, error) {
	prompt := fmt.Sprintf("A customer wants to negotiate the price of %s which costs GHS %d. Customer says: %q. Politely explain the price is fixed but offer to connect them to the manager.", productName, currentPrice, text)
	resp, err := b.client.Chat(prompt, "You are a helpful WhatsApp shop assistant.")
	if err != nil {
		return "", err
	}
	return resp, nil
}
