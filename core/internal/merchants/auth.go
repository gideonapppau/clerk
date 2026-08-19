package merchants

import (
	"database/sql"

	"github.com/google/uuid"
)

type AuthService struct {
	db *sql.DB
}

func NewAuthService(db *sql.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Authenticate(phone, password string) (string, error) {
	var id string
	err := s.db.QueryRow("SELECT id FROM merchants WHERE phone = $1", phone).Scan(&id)
	return id, err
}

func (s *AuthService) Register(name, phone string) (string, error) {
	var id string
	err := s.db.QueryRow(`INSERT INTO merchants (id, name, phone, plan, created_at, updated_at)
		VALUES ($1, $2, $3, 'trial', NOW(), NOW()) RETURNING id`, generateID(), name, phone).Scan(&id)
	return id, err
}

func generateID() string {
	return uuid.New().String()
}
