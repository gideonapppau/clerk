package llm

import (
	"encoding/json"
	"fmt"
	"strings"
)

type IntentClassification struct {
	Intent           string  `json:"intent"`
	Confidence       float64 `json:"confidence"`
	ViolationType    string  `json:"violation_type"`
	ViolationDetails string  `json:"violation_details"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type LLMResponse struct {
	Content string `json:"content"`
	Usage   Usage  `json:"usage"`
}

func ParseClassification(jsonStr string) (*IntentClassification, error) {
	jsonStr = strings.TrimSpace(jsonStr)

	if strings.HasPrefix(jsonStr, "```") {
		jsonStr = strings.TrimPrefix(jsonStr, "```json")
		jsonStr = strings.TrimPrefix(jsonStr, "```")
		jsonStr = strings.TrimSuffix(jsonStr, "```")
		jsonStr = strings.TrimSpace(jsonStr)
	}

	var classification IntentClassification
	if err := json.Unmarshal([]byte(jsonStr), &classification); err != nil {
		classification = IntentClassification{
			Intent:     "unknown",
			Confidence: 0.5,
		}
	}

	if classification.Intent == "" {
		classification.Intent = "unknown"
	}
	if classification.Confidence == 0 {
		classification.Confidence = 0.5
	}

	return &classification, nil
}

func ExtractJSON(text string) (map[string]interface{}, error) {
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start == -1 || end == -1 || end <= start {
		return nil, fmt.Errorf("no JSON found in text")
	}
	jsonStr := text[start : end+1]
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, err
	}
	return result, nil
}
