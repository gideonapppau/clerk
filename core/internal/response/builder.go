package response

import (
	"fmt"
	"strings"
)

type Builder struct {
	parts []string
}

func NewBuilder() *Builder {
	return &Builder{}
}

func (b *Builder) Add(text string) *Builder {
	b.parts = append(b.parts, text)
	return b
}

func (b *Builder) Addf(format string, args ...interface{}) *Builder {
	b.parts = append(b.parts, fmt.Sprintf(format, args...))
	return b
}

func (b *Builder) Build() string {
	return strings.Join(b.parts, "\n")
}

func (b *Builder) IsEmpty() bool {
	return len(b.parts) == 0
}

func (b *Builder) Reset() *Builder {
	b.parts = nil
	return b
}
