package merchants

import (
	"database/sql"
)

type Service struct {
	db   *sql.DB
	repo *Repository
}

func NewService(db *sql.DB) *Service {
	return &Service{
		db:   db,
		repo: NewRepository(db),
	}
}

func (s *Service) GetMerchant(id string) (*Merchant, error) {
	return s.repo.GetByID(id)
}

func (s *Service) Exists(id string) (bool, error) {
	return s.repo.Exists(id)
}

func (s *Service) UpdateName(id, name string) error {
	return s.repo.UpdateName(id, name)
}

func (s *Service) SetConnected(id string, connected bool) error {
	return s.repo.SetConnected(id, connected)
}
