package v1

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func createInventoryHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Name           string `json:"name" binding:"required"`
			Price          int    `json:"price" binding:"required,min=0"`
			Stock          *int   `json:"stock"`
			Category       string `json:"category"`
			Description    string `json:"description"`
			IsService      bool   `json:"isService"`
			Unit           string `json:"unit"`
			UnlimitedStock bool   `json:"unlimitedStock"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		id := uuid.New().String()
		stock := 0
		if req.Stock != nil {
			stock = *req.Stock
		}
		_, err := db.Exec(`INSERT INTO inventory (id, merchant_id, product_name, price, stock, category, description, is_service, unit, unlimited_stock, active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())`,
			id, merchantID, req.Name, req.Price, stock, req.Category, req.Description, req.IsService, req.Unit, req.UnlimitedStock)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create inventory item"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": id, "name": req.Name})
	}
}

func listInventoryHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		rows, err := db.Query(`SELECT id, product_name, price, stock, category, description, is_service, unit, unlimited_stock, active
			FROM inventory WHERE merchant_id = $1 AND active = true ORDER BY created_at DESC`, merchantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list inventory"})
			return
		}
		defer rows.Close()
		var items []gin.H
		for rows.Next() {
			var id, productName, category, description, unit string
			var price, stock int
			var isService, unlimitedStock, active bool
			_ = rows.Scan(&id, &productName, &price, &stock, &category, &description, &isService, &unit, &unlimitedStock, &active)
			items = append(items, gin.H{
				"id": id, "name": productName, "price": price, "stock": stock,
				"category": category, "description": description, "isService": isService,
				"unit": unit, "unlimitedStock": unlimitedStock, "active": active,
			})
		}
		c.JSON(http.StatusOK, gin.H{"data": items})
	}
}

func updateInventoryHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		itemID := c.Param("itemId")
		var req struct {
			Name           *string `json:"name"`
			Price          *int    `json:"price"`
			Stock          *int    `json:"stock"`
			Category       *string `json:"category"`
			Description    *string `json:"description"`
			IsService      *bool   `json:"isService"`
			Unit           *string `json:"unit"`
			UnlimitedStock *bool   `json:"unlimitedStock"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Name != nil {
			_, _ = db.Exec("UPDATE inventory SET product_name = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.Name, itemID, merchantID)
		}
		if req.Price != nil {
			_, _ = db.Exec("UPDATE inventory SET price = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.Price, itemID, merchantID)
		}
		if req.Stock != nil {
			_, _ = db.Exec("UPDATE inventory SET stock = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.Stock, itemID, merchantID)
		}
		if req.Category != nil {
			_, _ = db.Exec("UPDATE inventory SET category = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.Category, itemID, merchantID)
		}
		if req.Description != nil {
			_, _ = db.Exec("UPDATE inventory SET description = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.Description, itemID, merchantID)
		}
		if req.IsService != nil {
			_, _ = db.Exec("UPDATE inventory SET is_service = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.IsService, itemID, merchantID)
		}
		if req.Unit != nil {
			_, _ = db.Exec("UPDATE inventory SET unit = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.Unit, itemID, merchantID)
		}
		if req.UnlimitedStock != nil {
			_, _ = db.Exec("UPDATE inventory SET unlimited_stock = $1, updated_at = NOW() WHERE id = $2 AND merchant_id = $3", *req.UnlimitedStock, itemID, merchantID)
		}
		c.JSON(http.StatusOK, gin.H{"status": "updated"})
	}
}

func importInventoryHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		merchantID := c.GetString("merchantId")
		var req struct {
			Items []struct {
				Name        string `json:"name"`
				Price       int    `json:"price"`
				Stock       int    `json:"stock"`
				Category    string `json:"category"`
				Description string `json:"description"`
				IsService   bool   `json:"isService"`
				Unit        string `json:"unit"`
			} `json:"items" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		imported := 0
		for _, item := range req.Items {
			id := uuid.New().String()
			_, err := db.Exec(`INSERT INTO inventory (id, merchant_id, product_name, price, stock, category, description, is_service, unit, unlimited_stock, active, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, true, NOW(), NOW())`,
				id, merchantID, item.Name, item.Price, item.Stock, item.Category, item.Description, item.IsService, item.Unit)
			if err != nil {
				continue
			}
			imported++
		}
		c.JSON(http.StatusOK, gin.H{"imported": imported, "total": len(req.Items)})
	}
}
