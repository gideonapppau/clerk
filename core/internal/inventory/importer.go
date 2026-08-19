package inventory

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"
)

type ImportLine struct {
	Name        string `json:"name"`
	Price       int    `json:"price"`
	Stock       int    `json:"stock"`
	Category    string `json:"category"`
	Description string `json:"description"`
	IsService   bool   `json:"isService"`
	Unit        string `json:"unit"`
}

type ImportResult struct {
	Imported int `json:"imported"`
	Skipped  int `json:"skipped"`
	Errors   []string `json:"errors,omitempty"`
}

func ParseCSV(reader io.Reader) ([]ImportLine, error) {
	csvReader := csv.NewReader(reader)
	records, err := csvReader.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("CSV must have a header row and at least one data row")
	}

	var lines []ImportLine
	for i, record := range records {
		if i == 0 {
			continue
		}
		if len(record) < 2 {
			continue
		}
		line := ImportLine{
			Name:     strings.TrimSpace(record[0]),
			Category: strings.TrimSpace(record[2]),
			Unit:     "unit",
		}
		if len(record) > 1 {
			fmt.Sscanf(strings.TrimSpace(record[1]), "%d", &line.Price)
		}
		if len(record) > 3 {
			fmt.Sscanf(strings.TrimSpace(record[3]), "%d", &line.Stock)
		}
		if line.Name != "" {
			lines = append(lines, line)
		}
	}
	return lines, nil
}

func (line ImportLine) Validate() error {
	if line.Name == "" {
		return fmt.Errorf("name is required")
	}
	if line.Price < 0 {
		return fmt.Errorf("price must be non-negative")
	}
	return nil
}
