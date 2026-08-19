package commerce

import (
	"database/sql"
	"strings"
)

type InventoryRepo struct {
	db *sql.DB
}

func NewInventoryRepo(db *sql.DB) *InventoryRepo {
	return &InventoryRepo{db: db}
}

type InventoryMatch struct {
	ProductName string `json:"productName"`
	Price       int    `json:"price"`
	Stock       int    `json:"stock"`
}

func (r *InventoryRepo) CountActive(merchantID string) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*)::int FROM inventory WHERE merchant_id = $1 AND active = true", merchantID).Scan(&count)
	return count, err
}

func (r *InventoryRepo) GetItem(merchantID, productName string) (*InventoryMatch, error) {
	var m InventoryMatch
	err := r.db.QueryRow("SELECT product_name, price, stock FROM inventory WHERE merchant_id = $1 AND LOWER(product_name) = LOWER($2) AND active = true", merchantID, productName).Scan(&m.ProductName, &m.Price, &m.Stock)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *InventoryRepo) FindByFuzzy(merchantID, term string) ([]InventoryMatch, error) {
	var matches []InventoryMatch
	rows, err := r.db.Query(`SELECT product_name, price, stock FROM inventory WHERE merchant_id = $1 AND active = true AND LOWER(product_name) LIKE '%' || LOWER($2) || '%'`, merchantID, term)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var m InventoryMatch
		_ = rows.Scan(&m.ProductName, &m.Price, &m.Stock)
		matches = append(matches, m)
	}
	return matches, nil
}

func (r *InventoryRepo) ListAll(merchantID string) ([]InventoryItem, error) {
	rows, err := r.db.Query(`SELECT id, merchant_id, product_name, price, stock, category, description, is_service, unit, unlimited_stock, active, created_at, updated_at
		FROM inventory WHERE merchant_id = $1 AND active = true ORDER BY product_name`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		_ = rows.Scan(&item.ID, &item.MerchantID, &item.ProductName, &item.Price, &item.Stock, &item.Category, &item.Description, &item.IsService, &item.Unit, &item.UnlimitedStock, &item.Active, &item.CreatedAt, &item.UpdatedAt)
		items = append(items, item)
	}
	return items, nil
}

func (r *InventoryRepo) MatchProducts(merchantID string, terms []string) ([]InventoryMatch, error) {
	if len(terms) == 0 {
		return nil, nil
	}
	lowerTerms := make([]string, len(terms))
	for i, t := range terms {
		lowerTerms[i] = strings.ToLower(t)
	}
	rows, err := r.db.Query(`SELECT product_name, price, stock FROM inventory WHERE merchant_id = $1 AND LOWER(product_name) = ANY($2::text[]) AND active = true`, merchantID, lowerTerms)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var matches []InventoryMatch
	for rows.Next() {
		var m InventoryMatch
		_ = rows.Scan(&m.ProductName, &m.Price, &m.Stock)
		matches = append(matches, m)
	}
	return matches, nil
}

func (r *InventoryRepo) GetStock(merchantID, productName string) (int, error) {
	var stock int
	err := r.db.QueryRow("SELECT stock FROM inventory WHERE merchant_id = $1 AND LOWER(product_name) = LOWER($2) AND active = true", merchantID, productName).Scan(&stock)
	return stock, err
}
