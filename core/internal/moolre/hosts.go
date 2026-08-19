package moolre

import "fmt"

type Host string

const (
	SandboxHost    Host = "sandbox.moolre.com"
	ProductionHost Host = "api.moolre.com"
)

func (h Host) URL() string {
	return fmt.Sprintf("https://%s", h)
}

func (h Host) IsProduction() bool {
	return h == ProductionHost
}

func CurrentHost() Host {
	if ProductionHost.IsProduction() {
		return ProductionHost
	}
	return SandboxHost
}
