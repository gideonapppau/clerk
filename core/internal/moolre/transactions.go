package moolre

import (
	"encoding/json"
	"fmt"
)

type TransactionStatus struct {
	TransactionID string `json:"transactionId"`
	Status        Status `json:"status"`
	Amount        string `json:"amount"`
	Phone         string `json:"phone"`
	Reference     string `json:"reference"`
}

type TransactionDetail struct {
	TransactionID string `json:"transactionId"`
	Status        Status `json:"status"`
	Amount        string `json:"amount"`
	Value         string `json:"value"`
	ExternalRef   string `json:"externalRef"`
	Phone         string `json:"phone"`
}

func (c *Client) GetTransactionStatus(transactionID string) (*TransactionStatus, error) {
	resp, err := c.VerifyPayment(transactionID)
	if err != nil {
		return nil, fmt.Errorf("moolre: get transaction status: %w", err)
	}
	if len(resp.Data.Transactions) == 0 {
		return &TransactionStatus{
			TransactionID: transactionID,
			Status:        StatusFailed,
		}, nil
	}
	tx := resp.Data.Transactions[0]
	return &TransactionStatus{
		TransactionID: tx.TransactionID,
		Status:        Status(tx.TxStatus),
		Amount:        tx.Amount,
		Reference:     tx.ExternalRef,
	}, nil
}

func (c *Client) ListTransactions() ([]TransactionDetail, error) {
	respBody, err := c.doRequest("GET", c.baseURL+"/api/v1/payment/transactions", nil)
	if err != nil {
		return nil, fmt.Errorf("moolre: list transactions: %w", err)
	}
	var txResp TransactionResponse
	if err := json.Unmarshal(respBody, &txResp); err != nil {
		return nil, fmt.Errorf("moolre: decode transactions: %w", err)
	}
	var details []TransactionDetail
	for _, tx := range txResp.Data.Transactions {
		details = append(details, TransactionDetail{
			TransactionID: tx.TransactionID,
			Status:        Status(tx.TxStatus),
			Amount:        tx.Amount,
			Value:         tx.Value,
			ExternalRef:   tx.ExternalRef,
		})
	}
	return details, nil
}

func (c *Client) GetTransactionDetail(transactionID string) (*TransactionDetail, error) {
	resp, err := c.VerifyPayment(transactionID)
	if err != nil {
		return nil, fmt.Errorf("moolre: get transaction detail: %w", err)
	}
	if len(resp.Data.Transactions) == 0 {
		return nil, fmt.Errorf("moolre: transaction %s not found", transactionID)
	}
	tx := resp.Data.Transactions[0]
	return &TransactionDetail{
		TransactionID: tx.TransactionID,
		Status:        Status(tx.TxStatus),
		Amount:        tx.Amount,
		Value:         tx.Value,
		ExternalRef:   tx.ExternalRef,
	}, nil
}
