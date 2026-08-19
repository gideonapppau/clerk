package llm

import (
	"fmt"
)

func BuildNegotiatePrompt(productName string, price int, customerMessage string) string {
	return fmt.Sprintf(`A customer wants to negotiate the price of %s which costs GHS %d.
Customer says: %q

The price is fixed. Politely explain that the price is fixed but offer to connect them with the manager if they want to discuss further.
Be friendly and use Ghanaian English where natural.`, productName, price, TruncateMessage(customerMessage, MaxMessageLength))
}
