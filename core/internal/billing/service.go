package billing

import (
	"database/sql"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) GetMerchantPlan(merchantID string) (string, error) {
	var plan string
	err := s.db.QueryRow("SELECT COALESCE(plan, 'trial') FROM merchants WHERE id = $1", merchantID).Scan(&plan)
	if err != nil {
		return "trial", err
	}
	return plan, nil
}

func (s *Service) UpgradePlan(merchantID, plan string) error {
	if !IsValidPlan(plan) {
		plan = "trial"
	}
	_, err := s.db.Exec("UPDATE merchants SET plan = $1, updated_at = NOW() WHERE id = $2", plan, merchantID)
	return err
}

func (s *Service) DowngradeToTrial(merchantID string) error {
	_, err := s.db.Exec("UPDATE merchants SET plan = 'trial', updated_at = NOW() WHERE id = $1", merchantID)
	return err
}

func (s *Service) CanUseFeature(merchantID, feature string) (bool, error) {
	plan, err := s.GetMerchantPlan(merchantID)
	if err != nil {
		return false, err
	}
	limits := GetLimits(plan)
	for _, f := range limits.Features {
		if f == feature {
			return true, nil
		}
	}
	return false, nil
}
