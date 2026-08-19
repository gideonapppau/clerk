package conversations

import (
	"regexp"
	"time"
)

var greetingHoursStart = 5
var greetingHoursEnd = 22

func IsWithinActiveHours(t time.Time) bool {
	hour := t.Hour()
	return hour >= greetingHoursStart && hour < greetingHoursEnd
}

func TimeOfDayGreeting(t time.Time) string {
	hour := t.Hour()
	switch {
	case hour >= 5 && hour < 12:
		return "Morning! I dey here. Wetin you dey find?"
	case hour >= 12 && hour < 17:
		return "Good afternoon! Wetin you dey find?"
	case hour >= 17 && hour < 20:
		return "Good evening! Wetin I fit get for you?"
	default:
		return "Hey! Wetin I fit get for you today?"
	}
}

var goodbyePatterns = regexp.MustCompile(`(?i)^(bye|good night|see you|talk later|later|gotta go|not now|i'll come back|cya)$`)

func IsGoodbye(text string) bool {
	return goodbyePatterns.MatchString(text)
}
