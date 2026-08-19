package conversations

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

type ConversationRow struct {
	ID           string    `json:"id"`
	MerchantID   string    `json:"merchantId"`
	CustomerPhone string  `json:"customerPhone"`
	Status       string    `json:"status"`
	Mode         string    `json:"mode"`
	State        string    `json:"state"`
	Context      string    `json:"context"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (r *Repository) GetByID(id string) (*ConversationRow, error) {
	var c ConversationRow
	err := r.db.QueryRow(`SELECT id, merchant_id, customer_phone, status, COALESCE(mode, 'BOT'), COALESCE(state, 'idle'), COALESCE(context::text, '{}'), created_at, updated_at
		FROM conversations WHERE id = $1`, id).Scan(&c.ID, &c.MerchantID, &c.CustomerPhone, &c.Status, &c.Mode, &c.State, &c.Context, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) GetByMerchantAndPhone(merchantID, customerPhone string) (*ConversationRow, error) {
	var c ConversationRow
	err := r.db.QueryRow(`SELECT id, merchant_id, customer_phone, status, COALESCE(mode, 'BOT'), COALESCE(state, 'idle'), COALESCE(context::text, '{}'), created_at, updated_at
		FROM conversations WHERE merchant_id = $1 AND customer_phone = $2`, merchantID, customerPhone).Scan(&c.ID, &c.MerchantID, &c.CustomerPhone, &c.Status, &c.Mode, &c.State, &c.Context, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) ListByMerchant(merchantID string, limit int) ([]ConversationRow, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.db.Query(`SELECT id, merchant_id, customer_phone, status, COALESCE(mode, 'BOT'), COALESCE(state, 'idle'), COALESCE(context::text, '{}'), created_at, updated_at
		FROM conversations WHERE merchant_id = $1 ORDER BY updated_at DESC LIMIT $2`, merchantID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var conversations []ConversationRow
	for rows.Next() {
		var c ConversationRow
		_ = rows.Scan(&c.ID, &c.MerchantID, &c.CustomerPhone, &c.Status, &c.Mode, &c.State, &c.Context, &c.CreatedAt, &c.UpdatedAt)
		conversations = append(conversations, c)
	}
	return conversations, nil
}

func (r *Repository) Upsert(merchantID, customerPhone, status string) (string, error) {
	var id string
	err := r.db.QueryRow(`INSERT INTO conversations (id, merchant_id, customer_phone, mode, status, state, created_at, updated_at)
		VALUES ($1, $2, $3, 'BOT', $4, 'idle', NOW(), NOW())
		ON CONFLICT (merchant_id, customer_phone) DO UPDATE SET status = $4, updated_at = NOW()
		RETURNING id`,
		uuid.New().String(), merchantID, customerPhone, status).Scan(&id)
	return id, err
}

func (r *Repository) UpdateStatus(id, status string) error {
	_, err := r.db.Exec("UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

func (r *Repository) UpdateState(id, state string) error {
	_, err := r.db.Exec("UPDATE conversations SET state = $1, updated_at = NOW() WHERE id = $2", state, id)
	return err
}

func (r *Repository) UpdateMode(id, mode string) error {
	_, err := r.db.Exec("UPDATE conversations SET mode = $1, updated_at = NOW() WHERE id = $2", mode, id)
	return err
}

func (r *Repository) UpdateContext(id string, ctx interface{}) error {
	data, err := json.Marshal(ctx)
	if err != nil {
		return err
	}
	_, err = r.db.Exec("UPDATE conversations SET context = $1, updated_at = NOW() WHERE id = $2", data, id)
	return err
}

func (r *Repository) GetMode(id string) (string, error) {
	var mode string
	err := r.db.QueryRow("SELECT COALESCE(mode, 'BOT') FROM conversations WHERE id = $1", id).Scan(&mode)
	return mode, err
}

func (r *Repository) GetState(id string) (string, error) {
	var state string
	err := r.db.QueryRow("SELECT COALESCE(state, 'idle') FROM conversations WHERE id = $1", id).Scan(&state)
	return state, err
}

func (r *Repository) GetContext(id string) (map[string]interface{}, error) {
	var ctxData []byte
	err := r.db.QueryRow("SELECT COALESCE(context::bytea, '{}') FROM conversations WHERE id = $1", id).Scan(&ctxData)
	if err != nil {
		return nil, err
	}
	var ctx map[string]interface{}
	if err := json.Unmarshal(ctxData, &ctx); err != nil {
		return map[string]interface{}{}, nil
	}
	return ctx, nil
}

func (r *Repository) UpsertWithState(merchantID, customerPhone, status, state string, ctx interface{}) (string, error) {
	ctxData, _ := json.Marshal(ctx)
	var id string
	err := r.db.QueryRow(`INSERT INTO conversations (id, merchant_id, customer_phone, mode, status, state, context, created_at, updated_at)
		VALUES ($1, $2, $3, 'BOT', $4, $5, $6, NOW(), NOW())
		ON CONFLICT (merchant_id, customer_phone) DO UPDATE SET status = $4, state = $5, context = $6, updated_at = NOW()
		RETURNING id`,
		uuid.New().String(), merchantID, customerPhone, status, state, ctxData).Scan(&id)
	return id, err
}
