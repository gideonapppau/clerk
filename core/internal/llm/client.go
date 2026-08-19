package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Client struct {
	config      *Config
	httpClient  *http.Client
	groqKey     string
	openaiKey   string
	model       string
	baseURL     string
}

func NewClient(config *Config) *Client {
	groqKey := config.GroqKey
	if groqKey == "" {
		groqKey = os.Getenv("GROQ_API_KEY")
	}
	openaiKey := config.OpenAIKey
	if openaiKey == "" {
		openaiKey = os.Getenv("OPENAI_API_KEY")
	}
	model := config.Model
	if model == "" {
		model = "llama-3.1-70b-versatile"
	}
	return &Client{
		config:     config,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		groqKey:    groqKey,
		openaiKey:  openaiKey,
		model:      model,
		baseURL:    "https://api.groq.com/openai/v1",
	}
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage,omitempty"`
}

func (c *Client) Chat(prompt, systemMessage string) (string, error) {
	if c.groqKey == "" && c.openaiKey == "" {
		log.Printf("llm: no API key configured")
		return "", fmt.Errorf("llm: no API key configured")
	}

	if c.groqKey != "" {
		resp, err := c.sendRequest(c.baseURL+"/chat/completions", c.groqKey, systemMessage, prompt)
		if err == nil {
			return resp, nil
		}
		log.Printf("llm chat completion: %v", err)
	}

	if c.openaiKey != "" {
		log.Printf("trying OpenAI fallback")
		resp, err := c.sendRequest("https://api.openai.com/v1/chat/completions", c.openaiKey, systemMessage, prompt)
		if err == nil {
			return resp, nil
		}
		log.Printf("llm chat completion: %v", err)
		return "", fmt.Errorf("llm: all providers failed")
	}

	return "", fmt.Errorf("llm: all providers failed")
}

func (c *Client) sendRequest(url, apiKey, systemPrompt, userMessage string) (string, error) {
	reqBody := chatRequest{
		Model:       c.model,
		Temperature: c.config.Temperature,
		MaxTokens:   c.config.MaxTokens,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userMessage},
		},
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var chatResp chatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", err
	}
	if chatResp.Error != nil {
		return "", fmt.Errorf("LLM error: %s", chatResp.Error.Message)
	}
	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}
	return strings.TrimSpace(chatResp.Choices[0].Message.Content), nil
}
