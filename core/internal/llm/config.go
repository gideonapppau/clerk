package llm

import (
	"os"
)

type Config struct {
	GroqKey      string
	OpenAIKey    string
	Model        string
	Temperature  float64
	MaxTokens    int
}

func LoadConfig() *Config {
	model := os.Getenv("LLM_OPENAI_MODEL")
	if model == "" {
		model = "llama-3.1-70b-versatile"
	}
	return &Config{
		GroqKey:     os.Getenv("GROQ_API_KEY"),
		OpenAIKey:   os.Getenv("OPENAI_API_KEY"),
		Model:       model,
		Temperature: 0.3,
		MaxTokens:   500,
	}
}

var AvailableModels = []string{
	"llama-3.1-70b-versatile",
	"llama-3.1-8b-instant",
	"gpt-4o-mini",
	"gpt-4-0314",
	"gpt-4-0613",
	"gpt-5-mini",
	"gpt-5-nano",
	"o1-preview",
}
