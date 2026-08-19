package moolre

import "fmt"

type Account struct {
	ID         string `json:"id"`
	Phone      string `json:"phone"`
	Provider   string `json:"provider"`
	MerchantID string `json:"merchantId"`
}

type CreateAccountRequest struct {
	Phone      string `json:"phone"`
	MerchantID string `json:"merchant_id"`
}

func (c *Client) CreateAccount(merchantID, phone string) (*Account, error) {
	resp, err := c.GetAccount()
	if err != nil {
		return nil, fmt.Errorf("moolre: create account: %w", err)
	}
	return &Account{
		ID:         resp.Data.AccountID,
		Phone:      resp.Data.Phone,
		Provider:   "moolre",
		MerchantID: merchantID,
	}, nil
}

func (c *Client) GetAccountInfo() (*AccountResponse, error) {
	return c.GetAccount()
}

func (c *Client) ProvisionAccount(merchantID, phone string) (*Account, error) {
	return c.CreateAccount(merchantID, phone)
}
