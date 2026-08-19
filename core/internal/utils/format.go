package utils

import (
	"fmt"
	"strings"
)

func FormatCurrency(amount int, currency string) string {
	if currency == "" {
		currency = "GHS"
	}
	return fmt.Sprintf("%s %d", currency, amount)
}

func FormatPhoneNumber(phone string) string {
	phone = strings.TrimSpace(phone)
	phone = strings.TrimPrefix(phone, "+")
	if len(phone) == 10 && phone[0] == '0' {
		return "233" + phone[1:]
	}
	return phone
}

func Truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func NormalizePhone(phone string) string {
	phone = strings.TrimSpace(phone)
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	if !strings.HasPrefix(phone, "+") && !strings.HasPrefix(phone, "233") && len(phone) == 10 {
		phone = "233" + phone[1:]
	}
	return phone
}
