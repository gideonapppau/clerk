package paystack

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
	secretKey  string
	httpClient *http.Client
}

func NewClient(secretKey string) *Client {
	if secretKey == "" {
		secretKey = os.Getenv("PAYSTACK_SECRET_KEY")
	}
	return &Client{
		secretKey:  secretKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) IsConfigured() bool {
	return c.secretKey != ""
}

type InitializeResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

type VerifyResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Reference    string `json:"reference"`
		Status       string `json:"status"`
		Amount       int    `json:"amount"`
		Channel      string `json:"channel"`
		Currency     string `json:"currency"`
		CreatedAt    string `json:"created_at"`
		PaidAt       string `json:"paid_at"`
		Authorization struct {
			Bank              string `json:"bank"`
			Brand             string `json:"brand"`
			Last4             string `json:"last4"`
			ExpMonth          string `json:"exp_month"`
			ExpYear           string `json:"exp_year"`
			AuthorizationCode string `json:"authorization_code"`
		} `json:"authorization"`
	} `json:"data"`
}

type CreateCustomerResponse struct {
	Status  bool `json:"status"`
	Data    struct {
		ID           int    `json:"id"`
		Email        string `json:"email"`
		CustomerCode string `json:"customer_code"`
	} `json:"data"`
}

type CreateSubscriptionResponse struct {
	Status  bool `json:"status"`
	Data    struct {
		SubscriptionCode string `json:"subscription_code"`
		Email            string `json:"email"`
		Plan             int    `json:"plan"`
	} `json:"data"`
}

func (c *Client) doRequest(method, url string, reqBody interface{}) ([]byte, error) {
	var bodyReader io.Reader
	if reqBody != nil {
		body, err := json.Marshal(reqBody)
		if err != nil {
			return nil, fmt.Errorf("paystack: marshal request: %w", err)
		}
		bodyReader = bytes.NewReader(body)
	}
	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("paystack: create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("paystack: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("paystack: read response: %w", err)
	}
	return respBody, nil
}

func (c *Client) InitializeTransaction(email string, amount int, reference string) (authorizationURL, accessCode, ref string, err error) {
	reqBody := map[string]interface{}{
		"email":    email,
		"amount":   amount * 100,
		"reference": reference,
	}
	respBody, err := c.doRequest("POST", "https://api.paystack.co/transaction/initialize", reqBody)
	if err != nil {
		return "", "", "", err
	}
	var initResp InitializeResponse
	if err := json.Unmarshal(respBody, &initResp); err != nil {
		return "", "", "", fmt.Errorf("paystack: decode response: %w", err)
	}
	if !initResp.Status {
		return "", "", "", fmt.Errorf("paystack: %s", initResp.Message)
	}
	return initResp.Data.AuthorizationURL, initResp.Data.AccessCode, initResp.Data.Reference, nil
}

func (c *Client) VerifyTransaction(reference string) (status, paidAt string, amount int, err error) {
	respBody, err := c.doRequest("GET", "https://api.paystack.co/transaction/verify/"+reference, nil)
	if err != nil {
		return "", "", 0, err
	}
	var verifyResp VerifyResponse
	if err := json.Unmarshal(respBody, &verifyResp); err != nil {
		return "", "", 0, fmt.Errorf("paystack: decode response: %w", err)
	}
	if !verifyResp.Status {
		return "", "", 0, fmt.Errorf("paystack: %s", verifyResp.Message)
	}
	return verifyResp.Data.Status, verifyResp.Data.CreatedAt, verifyResp.Data.Amount, nil
}

func (c *Client) CreateCustomer(email, firstName string) (customerCode string, err error) {
	reqBody := map[string]interface{}{
		"email":      email,
		"first_name": firstName,
	}
	respBody, err := c.doRequest("POST", "https://api.paystack.co/customer", reqBody)
	if err != nil {
		return "", err
	}
	var custResp CreateCustomerResponse
	if err := json.Unmarshal(respBody, &custResp); err != nil {
		return "", fmt.Errorf("paystack: decode response: %w", err)
	}
	if !custResp.Status {
		return "", fmt.Errorf("paystack: create customer failed")
	}
	return custResp.Data.CustomerCode, nil
}

func (c *Client) CreateSubscription(customerCode, planCode string) (subscriptionCode string, err error) {
	reqBody := map[string]interface{}{
		"customer":       customerCode,
		"plan":           planCode,
		"authorization":  "",
		"start_date":     time.Now().Format("2006-01-02"),
	}
	respBody, err := c.doRequest("POST", "https://api.paystack.co/subscription", reqBody)
	if err != nil {
		return "", err
	}
	var subResp CreateSubscriptionResponse
	if err := json.Unmarshal(respBody, &subResp); err != nil {
		return "", fmt.Errorf("paystack: decode response: %w", err)
	}
	if !subResp.Status {
		return "", fmt.Errorf("paystack: create subscription failed")
	}
	return subResp.Data.SubscriptionCode, nil
}
