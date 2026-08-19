package inventory

import (
	"database/sql"
	"github.com/google/uuid"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

type Item struct {
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
}

func (r *Repository) Create(item *Item) error {
	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	_, err := r.db.Exec(`INSERT INTO inventory (id, merchant_id, product_name, price, stock, category, description, is_service, unit, unlimited_stock, active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())`,
		item.ID, item.MerchantID, item.ProductName, item.Price, item.Stock,
		item.Category, item.Description, item.IsService, item.Unit, item.UnlimitedStock)
	return err
}

func (r *Repository) ListByMerchant(merchantID string) ([]Item, error) {
	rows, err := r.db.Query(`SELECT id, merchant_id, product_name, price, stock, category, description, is_service, unit, unlimited_stock, active
		FROM inventory WHERE merchant_id = $1 AND active = true ORDER BY created_at DESC`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Item
	for rows.Next() {
		var item Item
		_ = rows.Scan(&item.ID, &item.MerchantID, &item.ProductName, &item.Price, &item.Stock,
			&item.Category, &item.Description, &item.IsService, &item.Unit, &item.UnlimitedStock, &item.Active)
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) CountActive(merchantID string) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*)::int FROM inventory WHERE merchant_id = $1 AND active = true", merchantID).Scan(&count)
	return count, err
}

func (r *Repository) ImportLines(merchantID string, lines []ImportLine) ImportResult {
	result := ImportResult{}
	for _, line := range lines {
		if err := line.Validate(); err != nil {
			result.Skipped++
			result.Errors = append(result.Errors, err.Error())
			continue
		}
		item := &Item{
			MerchantID:  merchantID,
			ProductName: line.Name,
			Price:       line.Price,
			Stock:       line.Stock,
			Category:    line.Category,
			Description: line.Description,
			IsService:   line.IsService,
			Unit:        line.Unit,
		}
		if err := r.Create(item); err != nil {
			result.Skipped++
			result.Errors = append(result.Errors, err.Error())
			continue
		}
		result.Imported++
	}
	return result
}
