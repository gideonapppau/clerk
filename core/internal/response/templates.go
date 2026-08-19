package response

import "fmt"

const (
	TemplateGreeting         = "Good afternoon! Wetin you dey find?"
	TemplateBrowse           = "Here is what we have in stock:"
	TemplateOrderProcess     = "Let me process that order for you now."
	TemplateOrderConfirm     = "Confirm the order and send payment details."
	TemplatePriceQuery       = "Send the exact item name."
	TemplateNegotiate        = "The price dey fixed. I go connect you to the seller if you want talk about am."
	TemplateCheckout         = "Nice one. We go check the payment and confirm am shortly."
	TemplatePayment          = "Sorry for the delay. Sending your payment link now."
	TemplateEscalation       = "Let me connect you to a member of our team to help you with that."
	TemplateCorrection       = "I no catch that well. Abeg send the exact item name."
	TemplateStop             = "No wahala! If you need anything else, just holla."
	TemplateAnythingElse     = "No problem. Let me know if there's anything else you need."
	TemplateFallback         = "I missed that. Could you please send the exact item name?"
	TemplateOrderIn          = "Your order is in. What else can I help you find?"
	TemplatePaymentLink      = "Payment link sent"
	TemplateDashboardReply   = "Open your dashboard to reply on WhatsApp."
	TemplateDashboardConfirm = "open your dashboard to confirm and send payment."
	TemplateNoInfo           = "No additional info just price"
	TemplateOutOfStock       = "We don't have *%s* anymore. No problem. Which item you want instead?"
	TemplateStillHave        = "Still have %s. Would you like to proceed with this order?"
	TemplateNoStockCustomer  = "Customer asking about *%s* no dey stock."
	TemplateOrderFailed      = "We couldn't complete your order for %s. Please let us know if you'd like to try another item."
	TemplateAutoFailed       = "We couldn't process this order automatically. Let me get someone from our team to assist you shortly."
	TemplateStockCheck       = "Still have %s. Would you like to proceed with this order?"
	TemplateNoAdditional     = "No additional info just price"
	TemplateNegotiatePrice   = "The price is fixed at GHS %s. Let me connect you with the manager if you'd like to discuss."
	TemplateNiceElse         = "Nice one! Wetin else you dey find?"
	TemplateWantInstead      = "Want to see what we carry instead?"
	TemplateHumanRedirect    = "Let me connect you to a member of our team to help you with that."
	TemplateScopeOnly        = "I can only help with %s. Please ask me for a product or category from this shop."
)

func FormatTemplate(template string, args ...interface{}) string {
	if len(args) == 0 {
		return template
	}
	return fmt.Sprintf(template, args...)
}
