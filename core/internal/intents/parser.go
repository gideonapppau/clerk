package intents

import (
	"strings"
)

type ParsedIntent struct {
	Raw         string
	Intent      string
	Product     string
	Category    string
	Quantity    int
	Confidence  float64
}

func Parse(text string) ParsedIntent {
	normalized := strings.TrimSpace(text)
	intent := Classify(normalized)
	category, product := ExtractCategoryAndProduct(normalized)

	return ParsedIntent{
		Raw:      normalized,
		Intent:   intent,
		Product:  product,
		Category: category,
		Quantity: 1,
	}
}

func (p ParsedIntent) IsOrder() bool {
	return p.Intent == IntentOrder || p.Intent == IntentProceedToOrder
}

func (p ParsedIntent) IsBrowse() bool {
	return p.Intent == IntentBrowseCategory
}

func (p ParsedIntent) IsPriceQuery() bool {
	return p.Intent == "price_query"
}

func (p ParsedIntent) IsGreeting() bool {
	return p.Intent == "greeting"
}

func (p ParsedIntent) IsCheckout() bool {
	return p.Intent == IntentCheckoutConfirm
}

func (p ParsedIntent) NeedsEscalation() bool {
	return p.Intent == IntentRequestedHuman
}

func (p ParsedIntent) IsInjection() bool {
	return p.Intent == IntentPromptInjection
}
