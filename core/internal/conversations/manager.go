package conversations

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/clerk/core/internal/commerce"
	"github.com/clerk/core/internal/intents"
)

type Manager struct {
	db *sql.DB
}

func NewManager(db *sql.DB) *Manager {
	return &Manager{db: db}
}

type HandleResult struct {
	Reply           string `json:"reply"`
	ConversationID  string `json:"conversationId"`
	State           string `json:"state"`
	OrderID         string `json:"orderId,omitempty"`
	PaymentURL      string `json:"paymentUrl,omitempty"`
	NeedsEscalation bool   `json:"needsEscalation"`
	Takeover        bool   `json:"takeover"`
}

type ConversationContext struct {
	ProductName     string `json:"productName,omitempty"`
	ProductPrice    int    `json:"productPrice,omitempty"`
	OrderID         string `json:"orderId,omitempty"`
	PendingQty      int    `json:"pendingQty,omitempty"`
	LastIntent      string `json:"lastIntent,omitempty"`
	AwaitingConfirm bool   `json:"awaitingConfirm,omitempty"`
}

func (m *Manager) HandleMessage(merchantID, customerPhone, text string) (*HandleResult, error) {
	normalized := strings.TrimSpace(text)
	if normalized == "" {
		return &HandleResult{Reply: "Still here. Were you looking for something specific?"}, nil
	}

	if intents.LooksLikePromptInjection(normalized) {
		return &HandleResult{
			Reply: "I can only help with product inquiries. Please ask me for a product or category from this shop.",
		}, nil
	}

	if intents.LooksLikeGibberish(normalized) {
		return &HandleResult{
			Reply: "I no catch that well. Abeg send the exact item name.",
		}, nil
	}

	if intents.LooksLikeEscalation(normalized) {
		_, _ = commerce.EmitEvent(m.db, merchantID, "escalation_requested", normalized)
		return &HandleResult{
			Reply:           "Let me connect you to a member of our team to help you with that.",
			NeedsEscalation: true,
			Takeover:        true,
		}, nil
	}

	if intents.LooksLikeFrustration(normalized) {
		_, _ = commerce.EmitEvent(m.db, merchantID, "customer_frustrated", normalized)
		return &HandleResult{
			Reply:           "Let me connect you to a member of our team to help you with that.",
			NeedsEscalation: true,
		}, nil
	}

	repo := NewRepository(m.db)
	convo, err := repo.GetByMerchantAndPhone(merchantID, customerPhone)
	var convoID string
	var currentState string
	var ctx ConversationContext

	if err != nil {
		convoID, err = repo.Upsert(merchantID, customerPhone, "ACTIVE")
		if err != nil {
			return &HandleResult{Reply: "I dey here. Wetin you dey find?"}, nil
		}
		currentState = "idle"
	} else {
		convoID = convo.ID
		currentState = convo.State
		if convo.Context != "" && convo.Context != "{}" {
			_ = json.Unmarshal([]byte(convo.Context), &ctx)
		}
	}

	intent := intents.Classify(normalized)

	result := &HandleResult{ConversationID: convoID}

	switch intent {
	case "greeting":
		greeting := TimeOfDayGreeting(time.Now())
		result.Reply = greeting
		result.State = "idle"
		repo.UpdateState(convoID, "idle")
		repo.UpdateContext(convoID, ConversationContext{LastIntent: "greeting"})

	case intents.IntentBrowseCategory:
		r, err := m.handleBrowse(merchantID, normalized, convoID)
		if err == nil {
			result = r
			result.ConversationID = convoID
		}

	case intents.IntentOrder:
		r, err := m.handleOrder(merchantID, normalized, convoID, customerPhone, currentState, ctx)
		if err == nil {
			result = r
			result.ConversationID = convoID
		}

	case "price_query":
		r, err := m.handlePriceQuery(merchantID, normalized, convoID)
		if err == nil {
			result = r
			result.ConversationID = convoID
		}

	case intents.IntentPriceNegotiation:
		result.Reply = "The price dey fixed. I go connect you to the seller if you want talk about am."
		result.State = currentState
		repo.UpdateContext(convoID, ConversationContext{LastIntent: "price_negotiation"})

	case intents.IntentCheckoutConfirm:
		r, err := m.handleCheckoutConfirm(merchantID, convoID, customerPhone, currentState, ctx)
		if err == nil {
			result = r
			result.ConversationID = convoID
		} else {
			result.Reply = "Nice one. We go check the payment and confirm am shortly."
			result.State = currentState
		}

	case intents.IntentPaymentFollowup:
		r, err := m.handlePaymentFollowup(convoID, ctx)
		if err == nil {
			result = r
			result.ConversationID = convoID
		} else {
			result.Reply = "Sorry for the delay. Sending your payment link now."
			result.State = currentState
		}

	case intents.IntentRequestedHuman:
		_, _ = commerce.EmitEvent(m.db, merchantID, "escalation_requested", normalized)
		result.Reply = "Let me connect you to a member of our team to help you with that."
		result.NeedsEscalation = true
		result.Takeover = true
		result.State = "escalated"
		repo.UpdateState(convoID, "escalated")
		repo.UpdateStatus(convoID, "WAITING_MERCHANT")

	case intents.IntentOrderCorrection:
		corrected := intents.ExtractCorrection(normalized)
		r, err := m.handleOrder(merchantID, corrected, convoID, customerPhone, currentState, ctx)
		if err == nil {
			result = r
			result.ConversationID = convoID
		}

	case "stop_replying":
		result.Reply = "No wahala! If you need anything else, just holla."
		result.State = "idle"
		repo.UpdateState(convoID, "idle")

	case intents.IntentCheckStock:
		r, err := m.handleBrowse(merchantID, normalized, convoID)
		if err == nil {
			result = r
			result.ConversationID = convoID
		}

	case "yes_confirmation":
		if currentState == "confirming" && ctx.AwaitingConfirm {
			r, err := m.handleCheckoutConfirm(merchantID, convoID, customerPhone, currentState, ctx)
			if err == nil {
				result = r
				result.ConversationID = convoID
			} else {
				result.Reply = "Nice one. We go check the payment and confirm am shortly."
				result.State = currentState
			}
		} else {
			result.Reply = "No wahala! If you need anything else, just holla."
			result.State = currentState
		}

	case "just_price":
		_, product := intents.ExtractCategoryAndProduct(normalized)
		if product != "" {
			r, err := m.handlePriceQuery(merchantID, normalized, convoID)
			if err == nil {
				result = r
				result.ConversationID = convoID
			}
		} else {
			result.Reply = "Got you. Na just price you want. Wetin else I fit help you with?"
			result.State = currentState
		}

	case "anything_else":
		result.Reply = "No problem. Let me know if there's anything else you need."
		result.State = "idle"
		repo.UpdateState(convoID, "idle")

	default:
		if currentState == "ordering" && ctx.ProductName != "" {
			if intents.LooksLikeAffirmative(normalized, currentState) {
				r, err := m.handleCheckoutConfirm(merchantID, convoID, customerPhone, currentState, ctx)
				if err == nil {
					result = r
					result.ConversationID = convoID
				} else {
					result.Reply = "Nice one. We go check the payment and confirm am shortly."
					result.State = currentState
				}
			} else {
				r, err := m.handleOrder(merchantID, normalized, convoID, customerPhone, currentState, ctx)
				if err == nil {
					result = r
					result.ConversationID = convoID
				}
			}
		} else {
			result.Reply = "I no catch that well. Abeg send the exact item name."
			result.State = currentState
		}
	}

	commerce.SaveMessage(m.db, convoID, "customer", normalized)
	commerce.SaveMessage(m.db, convoID, "clerk", result.Reply)

	return result, nil
}

func (m *Manager) handleBrowse(merchantID, text string, convoID string) (*HandleResult, error) {
	repo := commerce.NewInventoryRepo(m.db)
	count, err := repo.CountActive(merchantID)
	if err != nil {
		return &HandleResult{Reply: "I dey here. Wetin you dey find?"}, nil
	}
	if count == 0 {
		return &HandleResult{Reply: "I dey here. Wetin you dey find?"}, nil
	}
	convRepo := NewRepository(m.db)
	convRepo.UpdateState(convoID, "browsing")
	convRepo.UpdateContext(convoID, ConversationContext{LastIntent: "browse"})
	return &HandleResult{
		Reply: "Here is what we have in stock:",
		State: "browsing",
	}, nil
}

func (m *Manager) handlePriceQuery(merchantID, text string, convoID string) (*HandleResult, error) {
	repo := commerce.NewInventoryRepo(m.db)
	_, product := intents.ExtractCategoryAndProduct(text)

	if product != "" {
		item, err := repo.GetItem(merchantID, product)
		if err != nil {
			return &HandleResult{
				Reply: fmt.Sprintf("Customer asking about *%s* no dey stock.", product),
				State: "browsing",
			}, nil
		}
		convRepo := NewRepository(m.db)
		convRepo.UpdateState(convoID, "browsing")
		convRepo.UpdateContext(convoID, ConversationContext{
			ProductName:  item.ProductName,
			ProductPrice: item.Price,
			LastIntent:   "price_query",
		})
		return &HandleResult{
			Reply: fmt.Sprintf("GHS %d. Confirm in your dashboard.", item.Price),
			State: "browsing",
		}, nil
	}
	return &HandleResult{
		Reply: "Send the exact item name.",
		State: "browsing",
	}, nil
}

func (m *Manager) handleOrder(merchantID, text, convoID, customerPhone, currentState string, ctx ConversationContext) (*HandleResult, error) {
	repo := commerce.NewInventoryRepo(m.db)
	_, product := intents.ExtractCategoryAndProduct(text)

	if product == "" {
		return &HandleResult{
			Reply: "I no catch that well. Abeg send the exact item name.",
			State: "ordering",
		}, nil
	}

	matches, err := repo.FindByFuzzy(merchantID, product)
	if err != nil || len(matches) == 0 {
		return &HandleResult{
			Reply: fmt.Sprintf("We don't have *%s* anymore. No problem. Which item you want instead?", product),
			State: "ordering",
		}, nil
	}

	if len(matches) == 1 {
		mat := matches[0]
		if mat.Stock <= 0 {
			return &HandleResult{
				Reply: fmt.Sprintf("We're out of *%s*, and nothing else is in stock right now.", mat.ProductName),
				State: "ordering",
			}, nil
		}

		orderID, err := commerce.CreateOrder(m.db, merchantID, convoID, customerPhone, mat.ProductName, mat.Price, 1)
		if err != nil {
			return &HandleResult{
				Reply: "We couldn't process this order automatically. Let me get someone from our team to assist you shortly.",
				State: currentState,
			}, nil
		}

		convRepo := NewRepository(m.db)
		newCtx := ConversationContext{
			ProductName:     mat.ProductName,
			ProductPrice:    mat.Price,
			OrderID:         orderID,
			PendingQty:      1,
			LastIntent:      "order",
			AwaitingConfirm: true,
		}
		convRepo.UpdateState(convoID, "confirming")
		convRepo.UpdateContext(convoID, newCtx)

		return &HandleResult{
			Reply:   fmt.Sprintf("Still have %s. Would you like to proceed with this order?", mat.ProductName),
			State:   "confirming",
			OrderID: orderID,
		}, nil
	}

	var names []string
	for _, match := range matches {
		names = append(names, match.ProductName)
	}
	return &HandleResult{
		Reply: fmt.Sprintf("Here is what we have in stock:\n- %s", strings.Join(names, "\n- ")),
		State: "browsing",
	}, nil
}

func (m *Manager) handleCheckoutConfirm(merchantID, convoID, customerPhone, currentState string, ctx ConversationContext) (*HandleResult, error) {
	if ctx.OrderID == "" {
		return &HandleResult{
			Reply: "I no catch that well. Abeg send the exact item name.",
			State: currentState,
		}, fmt.Errorf("no pending order")
	}

	err := commerce.ConfirmOrder(m.db, ctx.OrderID)
	if err != nil {
		return &HandleResult{
			Reply: "We couldn't process this order automatically. Let me get someone from our team to assist you shortly.",
			State: currentState,
		}, err
	}

	convRepo := NewRepository(m.db)
	newCtx := ConversationContext{
		ProductName:  ctx.ProductName,
		ProductPrice: ctx.ProductPrice,
		OrderID:      ctx.OrderID,
		LastIntent:   "checkout",
	}
	convRepo.UpdateState(convoID, "payment_pending")
	convRepo.UpdateContext(convoID, newCtx)

	return &HandleResult{
		Reply:   "Nice one. We go check the payment and confirm am shortly.",
		State:   "payment_pending",
		OrderID: ctx.OrderID,
	}, nil
}

func (m *Manager) handlePaymentFollowup(convoID string, ctx ConversationContext) (*HandleResult, error) {
	if ctx.OrderID == "" {
		return &HandleResult{
			Reply: "Sorry for the delay. Sending your payment link now.",
			State: "idle",
		}, fmt.Errorf("no pending order")
	}

	checkoutURL, err := commerce.GetOrderCheckoutURL(m.db, ctx.OrderID)
	if err == nil && checkoutURL != "" {
		return &HandleResult{
			Reply:      fmt.Sprintf("Payment link: %s", checkoutURL),
			State:      "payment_pending",
			PaymentURL: checkoutURL,
			OrderID:    ctx.OrderID,
		}, nil
	}

	return &HandleResult{
		Reply:   "Sorry for the delay. Sending your payment link now.",
		State:   "payment_pending",
		OrderID: ctx.OrderID,
	}, nil
}
