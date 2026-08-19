package commerce

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Reservation struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"orderId"`
	Product   string    `json:"product"`
	Quantity  int       `json:"quantity"`
	Released  bool      `json:"released"`
	CreatedAt time.Time `json:"createdAt"`
}

func ReserveInventory(db *sql.DB, orderID, product string, quantity int) error {
	id := uuid.New().String()
	_, err := db.Exec(`INSERT INTO inventory_reservations (id, order_id, product_name, quantity, released, created_at)
		VALUES ($1, $2, $3, $4, false, NOW())`, id, orderID, product, quantity)
	return err
}

func ReleaseReservation(db *sql.DB, orderID string) error {
	_, err := db.Exec("UPDATE inventory_reservations SET released = true WHERE order_id = $1 AND released = false", orderID)
	return err
}

func CreateReservation(db *sql.DB, orderID, product string, quantity int) error {
	return ReserveInventory(db, orderID, product, quantity)
}

func ReleaseReservations(db *sql.DB, orderID string) error {
	return ReleaseReservation(db, orderID)
}
