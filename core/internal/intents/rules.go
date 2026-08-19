package intents

type IntentRule struct {
	Name    string
	Pattern string
	Intent  string
}

var Rules = []IntentRule{
	{Name: "greeting", Pattern: "greeting", Intent: "greeting"},
	{Name: "browse", Pattern: "browse", Intent: IntentBrowseCategory},
	{Name: "product_request", Pattern: "product_request", Intent: IntentProductRequest},
	{Name: "price_query", Pattern: "price_query", Intent: "price_query"},
	{Name: "order", Pattern: "order", Intent: IntentOrder},
	{Name: "payment", Pattern: "payment", Intent: IntentPaymentFollowup},
	{Name: "negotiation", Pattern: "price_negotiation", Intent: IntentPriceNegotiation},
	{Name: "escalation", Pattern: "escalation", Intent: IntentRequestedHuman},
	{Name: "correction", Pattern: "correction", Intent: IntentOrderCorrection},
	{Name: "checkout", Pattern: "checkout", Intent: IntentCheckoutConfirm},
	{Name: "complaint", Pattern: "complaint", Intent: "complaint"},
	{Name: "injection", Pattern: "injection", Intent: IntentPromptInjection},
}

func MatchRule(intent string) *IntentRule {
	for _, r := range Rules {
		if r.Intent == intent {
			return &r
		}
	}
	return nil
}
