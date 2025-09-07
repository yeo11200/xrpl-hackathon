const express = require("express");
const accountService = require("../services/accountService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

// 새 계정 생성
router.post("/create", 
  validateRequest(schemas.createAccount),
  async (req, res, next) => {
    try {
      const { nickname } = req.body;
      const result = await accountService.createAccount(nickname);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.account,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// 계정 정보 조회
router.get("/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const result = await accountService.getAccountInfo(address);

    if (result.success) {
      res.json({
        success: true,
        data: result.account,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

// XRP 전송
router.post("/:address/send",
  validateRequest(schemas.sendPaymentFromAccount),
  async (req, res, next) => {
    try {
      const { address } = req.params;
      const { toAddress, amount } = req.body;

      // 저장된 계정 정보 조회
      const storedAccount = accountService.getStoredAccount(address);
      if (!storedAccount) {
        return res.status(404).json({
          success: false,
          error: "Account not found in storage",
        });
      }

      const txRequest = {
        fromAddress: address,
        toAddress,
        amount: parseFloat(amount),
        secret: storedAccount.secret,
      };

      const result = await accountService.sendPayment(txRequest);

      if (result.success) {
        res.json({
          success: true,
          data: result.transaction,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// 트랜잭션 내역 조회
router.get("/:address/transactions", async (req, res, next) => {
  try {
    const { address } = req.params;
    const { limit = 20 } = req.query;

    const result = await accountService.getTransactionHistory(
      address,
      parseInt(limit)
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          address,
          transactions: result.transactions,
          count: result.transactions.length,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

// 모든 저장된 계정 조회
router.get("/", async (req, res, next) => {
  try {
    const accounts = accountService.getAllStoredAccounts();
    res.json({
      success: true,
      data: {
        accounts,
        count: accounts.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
