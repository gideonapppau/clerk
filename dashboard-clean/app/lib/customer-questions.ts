export type CustomerQuestion = {
  label: string
  text: string
}

export function buildCustomerQuestions(firstProductName?: string): CustomerQuestion[] {
  const product = firstProductName?.trim()
  const name = product || 'this'

  return [
    { label: 'Ask about stock', text: `Do you have ${name} in stock?` },
    { label: 'Ask the price', text: `How much is ${name}?` },
    { label: 'Place an order', text: product ? `I want to order ${product}` : 'I want to place an order' },
    { label: 'Say hello', text: 'Hi, are you open?' },
  ]
}

export function shopWhatsAppUrl(shopPhoneDigits: string, message: string): string {
  const digits = shopPhoneDigits.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
