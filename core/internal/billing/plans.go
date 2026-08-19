package billing

type Plan struct {
	Name        string   `json:"name"`
	DisplayName string   `json:"displayName"`
	Price       int      `json:"price"`
	Currency    string   `json:"currency"`
	Interval    string   `json:"interval"`
	Features    []string `json:"features"`
}

var Plans = map[string]Plan{
	"trial": {
		Name:        "trial",
		DisplayName: "Trial",
		Price:       0,
		Currency:    "GHS",
		Interval:    "monthly",
		Features:    []string{"basic"},
	},
	"starter": {
		Name:        "starter",
		DisplayName: "Starter",
		Price:       50,
		Currency:    "GHS",
		Interval:    "monthly",
		Features:    []string{"basic", "payments", "analytics"},
	},
	"growth": {
		Name:        "growth",
		DisplayName: "Growth",
		Price:       150,
		Currency:    "GHS",
		Interval:    "monthly",
		Features:    []string{"basic", "payments", "analytics", "priority"},
	},
}

func GetPlan(name string) Plan {
	if p, ok := Plans[name]; ok {
		return p
	}
	return Plans["trial"]
}

func IsValidPlan(name string) bool {
	_, ok := Plans[name]
	return ok
}

func DefaultPlan() string {
	return "trial"
}
