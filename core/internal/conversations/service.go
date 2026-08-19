package conversations

import (
	"database/sql"
)

type Service struct {
	db      *sql.DB
	manager *Manager
}

func NewService(db *sql.DB) *Service {
	return &Service{
		db:      db,
		manager: NewManager(db),
	}
}

func (s *Service) GetManager() *Manager {
	return s.manager
}
