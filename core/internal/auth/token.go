package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	MerchantID string `json:"merchantId"`
	jwt.RegisteredClaims
}

func getSecret() string {
	return os.Getenv("JWT_SECRET")
}

func SignToken(merchantID string) (string, error) {
	secret := getSecret()
	if secret == "" {
		return "", fmt.Errorf("auth: JWT_SECRET not configured")
	}
	claims := Claims{
		MerchantID: merchantID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "clerk-core",
			Subject:   merchantID,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func VerifyToken(tokenStr string) (*Claims, error) {
	secret := getSecret()
	if secret == "" {
		return nil, fmt.Errorf("auth: JWT_SECRET not configured")
	}
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("auth: invalid token: %w", err)
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("auth: invalid token claims")
	}
	if claims.MerchantID == "" {
		return nil, fmt.Errorf("auth: missing merchantId in token")
	}
	return claims, nil
}

func ParseToken(tokenString string) (string, error) {
	claims, err := VerifyToken(tokenString)
	if err != nil {
		return "", err
	}
	return claims.MerchantID, nil
}
