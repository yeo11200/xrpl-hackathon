const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const logger = require("./utils/logger");
const xrplRoutes = require("./routes/xrpl");
const paymentRoutes = require("./routes/payment");
const accountRoutes = require("./routes/account");
const shopRoutes = require("./routes/shop");
const errorHandler = require("./middleware/errorHandler");
const { supabase } = require("./services/supabaseClient");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// app.use('/api-docs', (req, res, next) => {
//   res.removeHeader('Content-Security-Policy');
//   next();
// });
// apiDoc 문서 서빙
app.use('/api-docs', express.static(path.join(__dirname, '../apidoc')));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,  // apiDoc 호환성을 위해 CSP 비활성화
}));

// CORS 설정: 개발은 localhost 전 포트 허용, 운영은 화이트리스트 사용
const devOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/;
const prodWhitelist = (process.env.CORS_ORIGINS || "https://yourdomain.com")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

/** @type {import('cors').CorsOptions} */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // 서버-서버/헬스체크 등 Origin 없음 허용
    if (!isProduction && devOriginRegex.test(origin)) return callback(null, true);
    if (isProduction && prodWhitelist.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * @api {get} /db-health Supabase DB health check
 * @apiName GetDBHealth
 * @apiGroup Account
 * @apiSuccess {String} status OK when connected
 * @apiSuccess {String} details Additional info
 */
app.get("/db-health", async (req, res, next) => {
	try {
		const { data, error } = await supabase.rpc('healthcheck');
		if (error) {
			return res.status(500).json({ status: "ERROR", error: error.message });
		}
		return res.json({ status: data === true ? "OK" : "UNKNOWN" });
	} catch (err) {
		return next(err);
	}
});

// API routes
app.use("/api/xrpl", xrplRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/shop", shopRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 XRPL Payment Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API 문서: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

module.exports = app;

