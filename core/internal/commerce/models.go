package commerce

type InventoryItem struct {
	ID             string `json:"id"`
	MerchantID     string `json:"merchantId"`
	ProductName    string `json:"productName"`
	Price          int    `json:"price"`
	Stock          int    `json:"stock"`
	Category       string `json:"category"`
	Description    string `json:"description"`
	IsService      bool   `json:"isService"`
	Unit           string `json:"unit"`
	UnlimitedStock bool   `json:"unlimitedStock"`
	Active         bool   `json:"active"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
}
