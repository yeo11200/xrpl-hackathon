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
const credentialRoutes = require("./routes/credential");
const errorHandler = require("./middleware/errorHandler");
const { supabase } = require("./services/supabaseClient");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Supabase와 같은 프록시 사용 시 필요한 설정
app.set("trust proxy", true);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// apiDoc 문서 서빙 (CSP 헤더 제거)
app.use(
  "/api-docs",
  (req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    next();
  },
  express.static(path.join(__dirname, "../apidoc"))
);

// CORS 허용 도메인 설정
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        process.env.FRONTEND_URL || "https://yourdomain.com",
        "https://api.coingecko.com",
        process.env.SUPABASE_URL, // Supabase URL
        "http://localhost:5173",
      ].filter(Boolean) // undefined 값 제거
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://api.coingecko.com",
      ];

app.use(
  cors({
    origin: (origin, callback) => {
      // origin이 없거나(같은 도메인) 허용된 도메인이면 허용
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Supabase나 다른 프록시를 통해 들어오는 실제 클라이언트 IP 처리
  keyGenerator: (req) => {
    const realIp =
      req.headers["x-real-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip;
    return realIp;
  },
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
    const { data, error } = await supabase.rpc("healthcheck");
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
app.use("/api/credential", credentialRoutes);
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
