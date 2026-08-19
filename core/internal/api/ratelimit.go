package api

import (
	"sync"
	"time"
)

type Limiter struct {
	requests map[string][]time.Time
	limit    int
	window   time.Duration
	mu       sync.Mutex
}

func NewLimiter(limit int, window time.Duration) *Limiter {
	return &Limiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-l.window)
	times := l.requests[key]
	valid := make([]time.Time, 0)
	for _, t := range times {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	if len(valid) >= l.limit {
		return false
	}
	l.requests[key] = append(valid, now)
	return true
}

func (l *Limiter) Remaining(key string) int {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-l.window)
	times := l.requests[key]
	valid := 0
	for _, t := range times {
		if t.After(cutoff) {
			valid++
		}
	}
	remaining := l.limit - valid
	if remaining < 0 {
		return 0
	}
	return remaining
}

func DefaultSimulateLimiter() *Limiter {
	return NewLimiter(10, time.Minute)
}
