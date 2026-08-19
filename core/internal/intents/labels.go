package intents

import (
	"regexp"
	"strings"
)

const (
	IntentProductRequest       = "PRODUCT_REQUEST"
	IntentBrowseCategory       = "BROWSE_CATEGORY"
	IntentCheckoutConfirm      = "CHECKOUT_CONFIRM"
	IntentOrderCorrection      = "ORDER_CORRECTION"
	IntentPaymentFollowup      = "PAYMENT_FOLLOWUP"
	IntentCheckStock           = "check_stock"
	IntentOrder                = "order"
	IntentPriceNegotiation     = "price_negotiation"
	IntentRequestedHuman       = "requested_human"
	IntentGroundingViolation   = "grounding_violation"
	IntentPromptInjection      = "PROMPT_INJECTION"
	IntentProceedToOrder       = "PROCEED_TO_ORDER"
	IntentImportInventory      = "IMPORT_INVENTORY"
	IntentNonStoreRequest      = "NON_STORE_REQUEST"
	IntentIdentityQuestion     = "IDENTITY_QUESTION"
)

var greetingRe = regexp.MustCompile(`(?i)^(?:hi|hello|hey|good morning|good afternoon|good evening|how far|how far na|wetin|abeg|pls|please|help|start|menu|help me|begin)$`)
var priceQueryRe = regexp.MustCompile(`(?i)(how much|what('s| is) (the )?price|price (of|for)|how much is|what does .+ cost)`)
var productBrowseRe = regexp.MustCompile(`(?i)^(?:inventory|stock list|product list|price list|your prices|menu|show me everything|show everything)[\s!.?]*$`)
var whatYouHaveRe = regexp.MustCompile(`(?i)what you (have|sell|carry|get)`)
var anythingElseRe = regexp.MustCompile(`(?i)anything else`)
var stopReplyingRe = regexp.MustCompile(`(?i)stop replying`)
var stillAvailableRe = regexp.MustCompile(`(?i)^(?:is|are)\s+(.+?)\s+(?:still\s+)?(?:available|in stock)\??$`)
var orderIntentRe = regexp.MustCompile(`(?i)(buy|order|want|need|get me|can i get|i('ll| will) take|looking for|do you have|i need)`)
var paymentRe = regexp.MustCompile(`(?i)(pay|payment|momo|mobile money|how (do|to) pay)`)
var correctionRe = regexp.MustCompile(`(?i)^(?:i\s+said|i\s+meant|not\s+that,?\s*)\s+(.+)$`)
var priceNegotiationRe = regexp.MustCompile(`(?i)(last price|best price|final price|lowest price|reduce|discount|negotiate|bring.*down|any.*off|cheaper|too expensive|last last|better price|too much|come down|knock off|bargain|make it cheaper|make am cheap|make am small|make it small|price too high|price high|reduce small|barter|haggle|haggling|cut the price|drop the price|give me discount|small discount|can you reduce|can you lower|abeg reduce|abeg make|what's your last|whats your last|what is your last|negotiat|lower the price|lower am|reduce the price|reduce it|reduce am|reduce it|e too much|too cost)`)
var humanEscalationRe = regexp.MustCompile(`(?i)speak to (a )?manager|(?i)(human|agent|manager)`)
var aboutProductsRe = regexp.MustCompile(`(?i)what (colors|sizes|variants|types|kind) do you (have|sell|carry|get)`)
var howMuchRe = regexp.MustCompile(`(?i)[,\s]+how much(?:\s+(?:be|is it|be that|now))?\s*\??$`)
var stillHaveRe = regexp.MustCompile(`(?i)^(?:what|how) about (?:the )?(.+?)\??$`)
var expressFrustrationRe = regexp.MustCompile(`(?i)frustrated|frustrating|annoying`)
var yesConfirmationRe = regexp.MustCompile(`(?i)^(yes|yeah|yep|yup|sure|ok|okay|confirm|confirmed|proceed|go ahead|absolutely|definitely|done)(\s+(please|pls|thanks|thank you))?\.?$`)
var justPriceRe = regexp.MustCompile(`(?i)^(.+?)\s+still dey\??$`)
var stockCheckRe = regexp.MustCompile(`(?i)(stock|available|have|got|sell)`)

func IsGroundingViolation(text, merchantScope string) bool {
	if merchantScope == "" {
		return false
	}
	scope := strings.ToLower(strings.TrimSpace(text))
	_ = scope
	return false
}

func Classify(text string) string {
	normalized := strings.TrimSpace(text)

	if LooksLikePromptInjection(normalized) {
		return IntentPromptInjection
	}
	if greetingRe.MatchString(normalized) {
		return "greeting"
	}
	if stopReplyingRe.MatchString(normalized) {
		return "stop_replying"
	}
	if anythingElseRe.MatchString(normalized) {
		return "anything_else"
	}
	if correctionRe.MatchString(normalized) {
		return IntentOrderCorrection
	}
	if priceNegotiationRe.MatchString(normalized) {
		return IntentPriceNegotiation
	}
	if humanEscalationRe.MatchString(normalized) {
		return IntentRequestedHuman
	}
	if stillAvailableRe.MatchString(normalized) {
		return IntentCheckStock
	}
	if justPriceRe.MatchString(normalized) {
		return "just_price"
	}
	if yesConfirmationRe.MatchString(normalized) {
		return "yes_confirmation"
	}
	if paymentRe.MatchString(normalized) {
		return IntentPaymentFollowup
	}
	if productBrowseRe.MatchString(normalized) || whatYouHaveRe.MatchString(normalized) {
		return IntentBrowseCategory
	}
	if aboutProductsRe.MatchString(normalized) {
		return IntentBrowseCategory
	}
	if orderIntentRe.MatchString(normalized) {
		return IntentOrder
	}
	if priceQueryRe.MatchString(normalized) || howMuchRe.MatchString(normalized) {
		return "price_query"
	}
	if stillHaveRe.MatchString(normalized) {
		return IntentCheckStock
	}
	if stockCheckRe.MatchString(normalized) {
		return IntentCheckStock
	}
	if expressFrustrationRe.MatchString(normalized) {
		return "express_frustration"
	}
	if expressFrustrationRe.MatchString(normalized) {
		return "complaint"
	}

	return "unknown"
}
