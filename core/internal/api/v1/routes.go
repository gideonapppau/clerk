package v1

import (
	"database/sql"

	"github.com/clerk/core/internal/api/middleware"
	"github.com/gin-gonic/gin"
)

func Register(r *gin.RouterGroup, db *sql.DB) {
	RegisterAuth(r, db)
	RegisterBilling(r, db)
	RegisterCheckout(r, db)
	RegisterConversations(r, db)
	RegisterEvents(r, db)
	RegisterFounder(r, db)
	RegisterFounderOps(r, db)
	RegisterFounderPipeline(r, db)
	RegisterInventory(r, db)
	RegisterOrders(r, db)
	RegisterPayments(r, db)
	RegisterPush(r, db)
	RegisterSimulate(r, db)
}

func RegisterAuth(r *gin.RouterGroup, db *sql.DB) {
	auth := r.Group("/auth")
	auth.POST("/login", loginHandler(db))
	auth.POST("/register", registerHandler(db))
	auth.POST("/logout", middleware.RequireAuthDB(db), logoutHandler(db))
	auth.GET("/me", middleware.RequireAuthDB(db), MeHandler(db))
	auth.PATCH("/me", middleware.RequireAuthDB(db), PatchMeHandler(db))
}

func RegisterBilling(r *gin.RouterGroup, db *sql.DB) {
	billing := r.Group("/billing", middleware.RequireAuthDB(db))
	billing.GET("/status", billingStatusHandler(db))
	billing.POST("/checkout", billingCheckoutHandler(db))
	billing.POST("/verify", billingVerifyHandler(db))
	billing.POST("/cancel", billingCancelHandler(db))
}

func RegisterCheckout(r *gin.RouterGroup, db *sql.DB) {
	checkout := r.Group("/checkout", middleware.RequireAuthDB(db))
	checkout.POST("/complete", checkoutCompleteHandler(db))
	checkout.POST("/initiate-payment", initiatePaymentHandler(db))
	checkout.POST("/issue-token", issueCheckoutTokenHandler(db))
	checkout.POST("/mark-paid", markOrderPaidAPIHandler(db))
	checkout.POST("/resolve", resolveCheckoutHandler(db))
	checkout.POST("/verify-token", verifyCheckoutTokenHandler(db))
}

func RegisterConversations(r *gin.RouterGroup, db *sql.DB) {
	conv := r.Group("/conversations", middleware.RequireAuthDB(db))
	conv.GET("", listConversationsHandler(db))
	conv.GET("/:conversationId", getConversationHandler(db))
	conv.POST("/:conversationId/resume", resumeHandler(db))
	conv.POST("/:conversationId/takeover", takeoverHandler(db))
}

func RegisterEvents(r *gin.RouterGroup, db *sql.DB) {
	r.GET("/events", middleware.RequireAuthDB(db), listEventsHandler(db))
}

func RegisterFounder(r *gin.RouterGroup, db *sql.DB) {
	fo := r.Group("/founder", middleware.RequireAuthDB(db))
	fo.GET("/overview", founderOverviewHandler(db))
	fo.GET("/merchants", founderMerchantsHandler(db))
	fo.GET("/funnel", founderFunnelHandler(db))
	fo.GET("/friction", founderFrictionHandler(db))
	fo.GET("/latency", founderLatencyHandler(db))
	fo.GET("/peak-hours", founderPeakHoursHandler(db))
	fo.GET("/timeseries", founderTimeseriesHandler(db))
	fo.GET("/unit-economics", founderUnitEconomicsHandler(db))
	fo.GET("/drop-offs", founderDropOffsHandler(db))
	fo.GET("/conversation-funnel", founderConversationFunnelHandler(db))
	fo.GET("/conversation-replay", founderConversationReplayHandler(db))
	fo.GET("/reliability", founderReliabilityHandler(db))
}

func RegisterFounderOps(r *gin.RouterGroup, db *sql.DB) {
	ops := r.Group("/founder/ops", middleware.RequireAuthDB(db))
	ops.GET("/scorecards", founderScorecardListHandler(db))
	ops.POST("/scorecards", founderScorecardUpsertHandler(db))
	ops.POST("/outreach", founderOutreachCreateHandler(db))
	ops.DELETE("/outreach/:id", founderOutreachDeleteHandler(db))
	ops.GET("/outreach", founderOutreachListHandler(db))
	ops.GET("/outreach/stats", founderOutreachStatsHandler(db))
	ops.GET("/content", founderContentGetHandler(db))
	ops.PUT("/content", founderContentUpsertHandler(db))
	ops.GET("/forecast", founderForecastHandler(db))
	ops.GET("/onboarding-health", founderOnboardingHealthHandler(db))
}

func RegisterFounderPipeline(r *gin.RouterGroup, db *sql.DB) {
	pl := r.Group("/founder/pipeline", middleware.RequireAuthDB(db))
	pl.POST("", founderPipelineCreateHandler(db))
	pl.GET("", founderPipelineListHandler(db))
	pl.PUT("/:id", founderPipelineUpdateHandler(db))
	pl.DELETE("/:id", founderPipelineDeleteHandler(db))
	pl.GET("/summary", founderPipelineSummaryHandler(db))
}

func RegisterInventory(r *gin.RouterGroup, db *sql.DB) {
	inv := r.Group("/inventory", middleware.RequireAuthDB(db))
	inv.POST("", createInventoryHandler(db))
	inv.GET("", listInventoryHandler(db))
	inv.PUT("/:itemId", updateInventoryHandler(db))
	inv.POST("/import", importInventoryHandler(db))
}

func RegisterOrders(r *gin.RouterGroup, db *sql.DB) {
	ord := r.Group("/orders", middleware.RequireAuthDB(db))
	ord.GET("", listOrdersHandler(db))
	ord.POST("/:orderId/confirm", confirmOrderHandler(db))
	ord.POST("/:orderId/cancel", cancelOrderHandler(db))
	r.GET("/orders/public/:orderId", getPublicOrderHandler(db))
}

func RegisterPayments(r *gin.RouterGroup, db *sql.DB) {
	pay := r.Group("/payments", middleware.RequireAuthDB(db))
	pay.GET("/methods", listMethodsHandler(db))
	pay.GET("/paystack", getPaystackHandler(db))
	pay.POST("/paystack", savePaystackHandler(db))
	pay.DELETE("/paystack", disconnectPaystackHandler(db))
	pay.GET("/moolre", getMoolreHandler(db))
	pay.POST("/moolre", saveMoolreHandler(db))
	pay.DELETE("/moolre", disconnectMoolreHandler(db))
	pay.POST("/momo", saveMomoHandler(db))
	pay.DELETE("/momo", removeMomoHandler(db))
	pay.POST("/moolre/provision", provisionMoolreHandler(db))
	pay.POST("/default", setDefaultHandler(db))
}

func RegisterPush(r *gin.RouterGroup, db *sql.DB) {
	push := r.Group("/push", middleware.RequireAuthDB(db))
	push.GET("/config", pushConfigHandler(db))
	push.GET("/status", pushStatusHandler(db))
	push.POST("/subscribe", pushSubscribeHandler(db))
	push.POST("/unsubscribe", pushUnsubscribeHandler(db))
	push.POST("/test", pushTestHandler(db))
}

func RegisterSimulate(r *gin.RouterGroup, db *sql.DB) {
	r.POST("/simulate", simulateHandler(db))
}
