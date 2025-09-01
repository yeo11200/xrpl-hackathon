const express = require("express");
const paymentService = require("../services/paymentService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

// Create payment request
router.post(
  "/request",
  validateRequest(schemas.createPaymentRequest),
  async (req, res, next) => {
    try {
      const { amount, description, merchantAddress } = req.body;

      const paymentRequest = await paymentService.createPaymentRequest(
        amount,
        description,
        merchantAddress
      );

      res.status(201).json({
        success: true,
        data: paymentRequest,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Process payment
router.post(
  "/process",
  validateRequest(schemas.processPayment),
  async (req, res, next) => {
    try {
      const { paymentId, customerWalletSeed, customerAddress } = req.body;

      const result = await paymentService.processPayment(
        paymentId,
        customerWalletSeed,
        customerAddress
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get payment status
router.get("/status/:paymentId", async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentStatus(paymentId);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

// Refund payment
router.post(
  "/refund",
  validateRequest(schemas.refundPayment),
  async (req, res, next) => {
    try {
      const { paymentId, merchantWalletSeed } = req.body;

      const result = await paymentService.refundPayment(
        paymentId,
        merchantWalletSeed
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get payment history
router.get("/history", async (req, res, next) => {
  try {
    const { address, type } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address parameter is required",
      });
    }

    const history = await paymentService.getPaymentHistory(address, type);

    res.json({
      success: true,
      data: {
        address,
        type: type || "all",
        payments: history,
        count: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Validate address
router.get("/validate-address/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const isValid = await paymentService.validateAddress(address);

    res.json({
      success: true,
      data: {
        address,
        isValid,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Validate seed
router.post("/validate-seed", async (req, res, next) => {
  try {
    const { seed } = req.body;
    const result = await paymentService.validateSeed(seed);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get payment statistics
router.get("/stats", async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address parameter is required",
      });
    }

    const allPayments = await paymentService.getPaymentHistory(address, "all");
    const sentPayments = allPayments.filter(
      (p) => p.customerAddress === address && p.status === "completed"
    );
    const receivedPayments = allPayments.filter(
      (p) => p.merchantAddress === address && p.status === "completed"
    );
    const pendingPayments = allPayments.filter((p) => p.status === "pending");

    const totalSent = sentPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalReceived = receivedPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    res.json({
      success: true,
      data: {
        address,
        totalPayments: allPayments.length,
        completedPayments: sentPayments.length + receivedPayments.length,
        pendingPayments: pendingPayments.length,
        totalSent,
        totalReceived,
        netAmount: totalReceived - totalSent,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
