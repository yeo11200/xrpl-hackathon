const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // XRPL specific errors
  if (err.message.includes("XRPL")) {
    return res.status(503).json({
      error: "XRPL Service Error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: "Validation Error",
      message: err.details[0].message,
      timestamp: new Date().toISOString(),
    });
  }

  // Payment specific errors
  if (
    err.message.includes("Payment") ||
    err.message.includes("balance") ||
    err.message.includes("wallet")
  ) {
    return res.status(400).json({
      error: "Payment Error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: "Server Error",
    message:
      process.env.NODE_ENV === "production" ? "Something went wrong" : message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
