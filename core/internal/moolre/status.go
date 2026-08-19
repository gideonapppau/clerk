package moolre

type Status int

const (
	StatusPending Status = 0
	StatusSuccess Status = 1
	StatusFailed  Status = 2
	StatusTimeout Status = 3
)

func (s Status) String() string {
	switch s {
	case StatusPending:
		return "pending"
	case StatusSuccess:
		return "success"
	case StatusFailed:
		return "failed"
	case StatusTimeout:
		return "timeout"
	default:
		return "unknown"
	}
}

func (s Status) IsSuccessful() bool {
	return s == StatusSuccess
}

func (s Status) IsPending() bool {
	return s == StatusPending
}

func (s Status) IsFailed() bool {
	return s == StatusFailed || s == StatusTimeout
}

func ParseStatus(code int) Status {
	switch code {
	case 0:
		return StatusPending
	case 1:
		return StatusSuccess
	case 2:
		return StatusFailed
	case 3:
		return StatusTimeout
	default:
		return StatusPending
	}
}
