const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("에러 발생:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // XRPL 관련 에러
  if (err.message.includes("XRPL") || err.message.includes("연결")) {
    return res.status(503).json({
      success: false,
      error: "XRPL Service Error",
      message: "XRPL 네트워크 연결에 문제가 있습니다",
      timestamp: new Date().toISOString(),
    });
  }

  // 검증 에러 (Joi)
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      message: err.details[0].message,
      timestamp: new Date().toISOString(),
    });
  }

  // 결제/지갑 관련 에러
  if (
    err.message.includes("잔액") ||
    err.message.includes("지갑") ||
    err.message.includes("송금") ||
    err.message.includes("계정")
  ) {
    return res.status(400).json({
      success: false,
      error: "Payment Error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // 기본 에러
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "서버 내부 오류가 발생했습니다" 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: "Server Error",
    message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
