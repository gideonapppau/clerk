package validate

import (
	"regexp"

	"github.com/google/uuid"
)

var uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func IsUUID(s string) bool {
	_, err := uuid.Parse(s)
	return err == nil
}

func IsValidUUID(s string) bool {
	return uuidRegex.MatchString(s)
}
