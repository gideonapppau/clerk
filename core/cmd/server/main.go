package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/clerk/core/internal/api"
	v1 "github.com/clerk/core/internal/api/v1"
	"github.com/clerk/core/internal/api/webhooks"
	"github.com/clerk/core/internal/config"
	"github.com/clerk/core/internal/conversations"
	"github.com/clerk/core/internal/database"
	"github.com/clerk/core/internal/intents"
	"github.com/clerk/core/internal/llm"
	"github.com/clerk/core/internal/push"

	"github.com/gin-gonic/gin"
)

func main() {
	env := config.Load()

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	llmConfig := llm.LoadConfig()
	_ = llm.NewBrain(llmConfig)

	pushSvc := push.NewService(db, env.VapidPrivate, env.VapidPublic)
	convManager := conversations.NewManager(db)
	_ = convManager
	_ = pushSvc

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(api.CORSMiddleware())

	r.GET("/health", api.HealthHandler(db))

	apiGroup := r.Group("/api")
	v1.Register(apiGroup, db)

	webhooks.RegisterAll(r, db)

	r.POST("/api/intent", intents.IntentHandler(db))
	r.GET("/api/me", api.MerchantHandler(db))
	r.POST("/api/message", api.MessageHandler(db))

	port := env.Port
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Printf("Clerk Core starting on port %s\n", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}
