const express = require("express");
const xrplClient = require("../services/xrplClient");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

// Get server info
router.get("/server-info", async (req, res, next) => {
  try {
    const serverInfo = await xrplClient.getServerInfo();
    res.json({
      success: true,
      data: serverInfo,
    });
  } catch (error) {
    next(error);
  }
});

// Create new wallet
router.post(
  "/wallet",
  validateRequest(schemas.createWallet),
  async (req, res, next) => {
    try {
      const { fund } = req.body;
      const wallet = await xrplClient.createWallet();

      if (fund) {
        try {
          await xrplClient.fundWallet(wallet.address);
          wallet.funded = true;
        } catch (fundError) {
          logger.warn(`Failed to fund wallet ${wallet.address}:`, fundError);
          wallet.funded = false;
        }
      }

      res.json({
        success: true,
        data: {
          address: wallet.address,
          seed: wallet.seed,
          publicKey: wallet.publicKey,
          funded: wallet.funded || false,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get account info
router.get("/account/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const accountInfo = await xrplClient.getAccountInfo(address);

    res.json({
      success: true,
      data: accountInfo,
    });
  } catch (error) {
    next(error);
  }
});

// Get account balance
router.get("/account/:address/balance", async (req, res, next) => {
  try {
    const { address } = req.params;
    const balance = await xrplClient.getAccountBalance(address);

    res.json({
      success: true,
      data: {
        address,
        balance: balance.toString(),
        balanceXRP: parseFloat(balance),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Send payment
router.post(
  "/send-payment",
  validateRequest(schemas.sendPayment),
  async (req, res, next) => {
    try {
      const { toAddress, amount, fromWalletSeed } = req.body;

      // Create wallet from seed
      const xrpl = require("xrpl");
      const fromWallet = xrpl.Wallet.fromSeed(fromWalletSeed);

      // Send payment
      const result = await xrplClient.sendPayment(
        fromWallet,
        toAddress,
        amount
      );

      res.json({
        success: true,
        data: {
          transactionHash: result.hash,
          fromAddress: fromWallet.address,
          toAddress,
          amount,
          validated: result.validated,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction details
router.get("/transaction/:hash", async (req, res, next) => {
  try {
    const { hash } = req.params;
    const transaction = await xrplClient.getTransaction(hash);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Fund wallet (testnet only)
router.post("/fund-wallet/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const result = await xrplClient.fundWallet(address);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Validate address
router.get("/validate-address/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const xrpl = require("xrpl");
    const isValid = xrpl.isValidClassicAddress(address);

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
    const xrpl = require("xrpl");

    try {
      const wallet = xrpl.Wallet.fromSeed(seed);
      res.json({
        success: true,
        data: {
          isValid: true,
          address: wallet.address,
        },
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          isValid: false,
          error: error.message,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// 트랜잭션 내역 조회 (새 스키마 사용)
router.get(
  "/account/:address/transactions",
  validateRequest(schemas.getTransactions), // 새 스키마 적용
  async (req, res, next) => {
    try {
      const { address } = req.params;
      const { limit = 20 } = req.query;

      // ... 로직 실행 ...

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
