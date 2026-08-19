package merchants

import (
	"database/sql"
	"time"
)

type Merchant struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Phone        string `json:"phone"`
	Plan         string `json:"plan"`
	Connected    bool   `json:"connected"`
	BusinessScope string `json:"businessScope"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetByID(id string) (*Merchant, error) {
	var m Merchant
	err := r.db.QueryRow(`SELECT id, COALESCE(name, ''), COALESCE(phone, ''), COALESCE(plan, 'trial'),
		COALESCE(connected, false), COALESCE(business_scope, ''), created_at
		FROM merchants WHERE id = $1`, id).Scan(&m.ID, &m.Name, &m.Phone, &m.Plan, &m.Connected, &m.BusinessScope, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *Repository) Exists(id string) (bool, error) {
	var exists bool
	err := r.db.QueryRow("SELECT EXISTS(SELECT 1 FROM merchants WHERE id = $1)", id).Scan(&exists)
	return exists, err
}

func (r *Repository) GetPhone(id string) (string, error) {
	var phone string
	err := r.db.QueryRow("SELECT COALESCE(phone, '') FROM merchants WHERE id = $1", id).Scan(&phone)
	return phone, err
}

func (r *Repository) GetName(id string) (string, error) {
	var name string
	err := r.db.QueryRow("SELECT COALESCE(name, '') FROM merchants WHERE id = $1", id).Scan(&name)
	return name, err
}

func (r *Repository) UpdateName(id, name string) error {
	_, err := r.db.Exec("UPDATE merchants SET name = $1, updated_at = NOW() WHERE id = $2", name, id)
	return err
}

func (r *Repository) UpdatePlan(id, plan string) error {
	_, err := r.db.Exec("UPDATE merchants SET plan = $1, updated_at = NOW() WHERE id = $2", plan, id)
	return err
}

func (r *Repository) UpdateBusinessScope(id, scope string) error {
	_, err := r.db.Exec("UPDATE merchants SET business_scope = $1, updated_at = NOW() WHERE id = $2", scope, id)
	return err
}

func (r *Repository) SetConnected(id string, connected bool) error {
	_, err := r.db.Exec("UPDATE merchants SET connected = $1, updated_at = NOW() WHERE id = $2", connected, id)
	return err
}

func (r *Repository) Disconnect(id string) error {
	_, err := r.db.Exec("UPDATE merchants SET connected = false, phone = '', updated_at = NOW() WHERE id = $1", id)
	return err
}

func (r *Repository) DisconnectAll() error {
	_, err := r.db.Exec("UPDATE merchants SET connected = false, updated_at = NOW() WHERE connected = true")
	return err
}

func (r *Repository) SetLastLogout(id string) error {
	_, err := r.db.Exec("UPDATE merchants SET last_logout_at = NOW(), updated_at = NOW() WHERE id = $1", id)
	return err
}

func (r *Repository) GetLastLogout(id string) (*time.Time, error) {
	var t sql.NullTime
	err := r.db.QueryRow("SELECT last_logout_at FROM merchants WHERE id = $1", id).Scan(&t)
	if err != nil {
		return nil, err
	}
	if t.Valid {
		return &t.Time, nil
	}
	return nil, nil
}

func (r *Repository) ListAll() ([]Merchant, error) {
	rows, err := r.db.Query(`SELECT id, COALESCE(name, ''), COALESCE(phone, ''), COALESCE(plan, 'trial'),
		COALESCE(connected, false), COALESCE(business_scope, ''), created_at
		FROM merchants ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var merchants []Merchant
	for rows.Next() {
		var m Merchant
		_ = rows.Scan(&m.ID, &m.Name, &m.Phone, &m.Plan, &m.Connected, &m.BusinessScope, &m.CreatedAt)
		merchants = append(merchants, m)
	}
	return merchants, nil
}

func (r *Repository) ListWithWhatsAppStatus() ([]struct {
	ID             string `json:"id"`
	WhatsAppLinked bool   `json:"whatsappLinked"`
}, error) {
	rows, err := r.db.Query("SELECT id, (connected_at IS NOT NULL) AS whatsapp_linked FROM merchants")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []struct {
		ID             string `json:"id"`
		WhatsAppLinked bool   `json:"whatsappLinked"`
	}
	for rows.Next() {
		var r struct {
			ID             string `json:"id"`
			WhatsAppLinked bool   `json:"whatsappLinked"`
		}
		_ = rows.Scan(&r.ID, &r.WhatsAppLinked)
		result = append(result, r)
	}
	return result, nil
}

func (r *Repository) Count() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*)::int FROM merchants").Scan(&count)
	return count, err
}

func (r *Repository) CountRecent(days int) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*)::int FROM merchants WHERE created_at >= NOW() - $1", days).Scan(&count)
	return count, err
}
