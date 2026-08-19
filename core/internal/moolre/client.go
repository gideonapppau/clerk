package moolre

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type Client struct {
	privateKey string
	publicKey  string
	baseURL    string
	httpClient *http.Client
}

func NewClient() *Client {
	cfg := LoadConfig()
	return &Client{
		privateKey: cfg.PrivateKey,
		publicKey:  cfg.PublicKey,
		baseURL:    cfg.BaseURL(),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func NewClientFromConfig(cfg *Config) *Client {
	return &Client{
		privateKey: cfg.PrivateKey,
		publicKey:  cfg.PublicKey,
		baseURL:    cfg.BaseURL(),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

type TransactionRequest struct {
	Amount      int    `json:"amount"`
	Phone       string `json:"phone"`
	Reference   string `json:"reference"`
	Description string `json:"description"`
}

type TransactionResponse struct {
	Status int `json:"status"`
	Data   struct {
		Transactions []Transaction `json:"transactions"`
	} `json:"data"`
}

type Transaction struct {
	TxStatus      int    `json:"txstatus"`
	Amount        string `json:"amount"`
	Value         string `json:"value"`
	TransactionID string `json:"transactionid"`
	ExternalRef   string `json:"externalref"`
}

type VerifyResponse struct {
	Status int `json:"status"`
	Data   struct {
		Transactions []Transaction `json:"transactions"`
	} `json:"data"`
}

type AccountResponse struct {
	Status int `json:"status"`
	Data   struct {
		AccountID string `json:"account_id"`
		Phone     string `json:"phone"`
	} `json:"data"`
}

func (c *Client) doRequest(method, url string, body interface{}) ([]byte, error) {
	var bodyReader io.Reader
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("moolre: marshal request: %w", err)
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}
	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("moolre: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if c.privateKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.privateKey)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("moolre: request failed: %w", err)
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("moolre: read response: %w", err)
	}
	return respBody, nil
}

func (c *Client) InitializePayment(phone string, amount int, externalRef string) (authorizationURL, reference string, err error) {
	reqBody := TransactionRequest{
		Amount:      amount,
		Phone:       phone,
		Reference:   externalRef,
		Description: fmt.Sprintf("Clerk order %s", externalRef),
	}
	respBody, err := c.doRequest("POST", c.baseURL+"/api/v1/payment/initiate", reqBody)
	if err != nil {
		return "", "", err
	}
	var txResp TransactionResponse
	if err := json.Unmarshal(respBody, &txResp); err != nil {
		return "", "", fmt.Errorf("moolre: decode response: %w", err)
	}
	if txResp.Status != 200 && txResp.Status != 201 {
		return "", "", fmt.Errorf("moolre: payment initiation failed (status %d)", txResp.Status)
	}
	return "", externalRef, nil
}

func (c *Client) VerifyTransaction(transactionID string) (status int, amount string, err error) {
	respBody, err := c.doRequest("GET", c.baseURL+"/api/v1/payment/verify/"+transactionID, nil)
	if err != nil {
		return 0, "", err
	}
	var verifyResp VerifyResponse
	if err := json.Unmarshal(respBody, &verifyResp); err != nil {
		return 0, "", fmt.Errorf("moolre: decode response: %w", err)
	}
	if len(verifyResp.Data.Transactions) == 0 {
		return 0, "", fmt.Errorf("moolre: no transactions found for %s", transactionID)
	}
	tx := verifyResp.Data.Transactions[0]
	return tx.TxStatus, tx.Amount, nil
}

func (c *Client) VerifyPayment(reference string) (*VerifyResponse, error) {
	respBody, err := c.doRequest("GET", c.baseURL+"/api/v1/payment/verify/"+reference, nil)
	if err != nil {
		return nil, err
	}
	var verifyResp VerifyResponse
	if err := json.Unmarshal(respBody, &verifyResp); err != nil {
		return nil, fmt.Errorf("moolre: decode response: %w", err)
	}
	return &verifyResp, nil
}

func (c *Client) GetAccount() (*AccountResponse, error) {
	respBody, err := c.doRequest("GET", c.baseURL+"/api/v1/account", nil)
	if err != nil {
		return nil, fmt.Errorf("moolre: get account: %w", err)
	}
	var accountResp AccountResponse
	if err := json.Unmarshal(respBody, &accountResp); err != nil {
		return nil, fmt.Errorf("moolre: decode account: %w", err)
	}
	return &accountResp, nil
}

func (c *Client) IsConfigured() bool {
	return c.privateKey != "" && c.publicKey != ""
}

func ParseWebhook(body []byte) (*TransactionResponse, error) {
	var resp TransactionResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("invalid moolre webhook payload: %w", err)
	}
	return &resp, nil
}

func IsPaymentSuccessful(tx Transaction) bool {
	return tx.TxStatus == 1
}

func GetEnvOrDefault(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}
