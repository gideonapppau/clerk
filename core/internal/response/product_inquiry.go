package response

import (
	"fmt"
	"strings"
)

type ProductInquiryResult struct {
	Found     bool
	ProductName string
	Price     int
	Stock     int
	Alternatives []string
}

func BuildProductInquiryResponse(result ProductInquiryResult) string {
	if !result.Found {
		if len(result.Alternatives) > 0 {
			return fmt.Sprintf("We don't have *%s* anymore. No problem. Which item you want instead?", result.ProductName)
		}
		return fmt.Sprintf("Customer asking about *%s* no dey stock.", result.ProductName)
	}
	if result.Stock <= 0 {
		return fmt.Sprintf("We don't have *%s* anymore. No problem. Which item you want instead?", result.ProductName)
	}
	return fmt.Sprintf("Still have %s. Would you like to proceed with this order?", result.ProductName)
}

func BuildAlternativesResponse(alternatives []string) string {
	if len(alternatives) == 0 {
		return "Want to see what we carry instead?"
	}
	return "Want to see what we carry instead?\n- " + strings.Join(alternatives, "\n- ")
}

func BuildOutOfStockMessage(productName string) string {
	return fmt.Sprintf("We couldn't complete your order for %s. Please let us know if you'd like to try another item.", productName)
}

func BuildOrderFailedMessage() string {
	return "We couldn't process this order automatically. Let me get someone from our team to assist you shortly."
}
