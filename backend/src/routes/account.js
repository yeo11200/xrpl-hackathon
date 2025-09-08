const express = require("express");
const accountService = require("../services/accountService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();


// 새 계정 생성
/**
 * @swagger
 * /api/account/create:
 *   post:
 *     summary: XRPL 계정 생성
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 생성할 계정의 닉네임
 *                 example: "arum"
 *     responses:
 *       201:
 *         description: 계정 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       description: XRPL 계정 주소
 *                       example: "rpJ4Mstv3xqSMvBvddyFBYLDyiikynA3hc"
 *                     secret:
 *                       type: string
 *                       description: 계정 시크릿 키
 *                       example: "sEdTXU7qwRWcPLtoF7CXKT7YndGrH63"
 *                     publicKey:
 *                       type: string
 *                       description: 공개 키
 *                       example: "EDA3A4380926D5594130777DD2CFA007EA398D5FAF6134EC6AF35FD579F368FA72"
 *                     privateKey:
 *                       type: string
 *                       description: 개인 키
 *                       example: "ED2AF79EE3270AEE29A135B69FA31A61F50CA02F8A7C21AA30ACDA02FAA1B134A0"
 *                     balance:
 *                       type: number
 *                       description: 계정 잔액 (XRP)
 *                       example: 10
 *                     userId:
 *                       type: string
 *                       description: 사용자 닉네임
 *                       example: "arum"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: 계정 생성 시간
 *                       example: "2025-09-08T12:33:24.221Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: 계정 수정 시간
 *                       example: "2025-09-08T12:33:24.221Z"
 *       400:
 *         description: 입력 값 검증 실패 또는 비즈니스 로직 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Validation Error"
 *                 message:
 *                   type: string
 *                   example: "닉네임은 최소 2자 이상이어야 합니다"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "nickname"
 *                       message:
 *                         type: string
 *                         example: "닉네임은 최소 2자 이상이어야 합니다"
 */
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
/**
 * @swagger
 * /api/account/{address}:
 *   get:
 *     summary: XRPL 계정 정보 조회
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 XRPL 계정의 주소
 *         example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *     responses:
 *       200:
 *         description: 계정 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: XRPL 계정 정보
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *                     balance:
 *                       type: string
 *                       example: "1000000"
 *                     nickname:
 *                       type: string
 *                       example: "alice123"
 *       404:
 *         description: 계정을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Account not found"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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
/**
 * @swagger
 * /api/account/{address}/send:
 *   post:
 *     summary: XRP 전송
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: 송금자(소유자) XRPL 계정 주소
 *         example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toAddress
 *               - amount
 *             properties:
 *               toAddress:
 *                 type: string
 *                 description: 수신자 XRPL 계정 주소
 *                 example: "rs8dupWr8dA9cntGP1UoxSwzf3dzabYfgJ"
 *               amount:
 *                 type: number
 *                 description: 전송할 XRP 양 (Drop 단위 아님, XRP 단위)
 *                 example: 50
 *     responses:
 *       200:
 *         description: 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: 전송 결과 트랜잭션 정보
 *       400:
 *         description: 요청 검증 실패 또는 비즈니스 로직 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Insufficient balance"
 *       404:
 *         description: 저장된 계정 정보 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Account not found in storage"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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
/**
 * @swagger
 * /api/account/{address}/transactions:
 *   get:
 *     summary: 계정의 트랜잭션 내역 조회
 *     tags: [Transaction]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 XRPL 계정 주소
 *         example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 반환할 트랜잭션 최대 개수
 *         example: 20
 *     responses:
 *       200:
 *         description: 트랜잭션 내역 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hash:
 *                             type: string
 *                             example: "33EA42FC7A06F062A7B843AF4DC7C0AB00D6644DFDF4C5D354A87C035813D321"
 *                           type:
 *                             type: string
 *                             example: "Payment"
 *                           amount:
 *                             type: string
 *                             example: "1000000"
 *                           date:
 *                             type: string
 *                             example: "2024-01-15T10:30:00Z"
 *                           from:
 *                             type: string
 *                             example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *                           to:
 *                             type: string
 *                             example: "rs8dupWr8dA9cntGP1UoxSwzf3dzabYfgJ"
 *                     count:
 *                       type: integer
 *                       description: 반환된 트랜잭션 개수
 *                       example: 5
 *       400:
 *         description: 요청 오류 또는 계정 정보 조회 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid account address"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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
/**
 * @swagger
 * /api/account/:
 *   get:
 *     summary: 저장된 모든 XRPL 계정 목록 조회
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: 저장된 계정 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       description: 저장된 XRPL 계정 배열
 *                       items:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                             example: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
 *                           nickname:
 *                             type: string
 *                             example: "alice123"
 *                           balance:
 *                             type: string
 *                             example: "1000000"
 *                     count:
 *                       type: integer
 *                       description: 저장된 계정 개수
 *                       example: 3
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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
