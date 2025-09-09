const express = require("express");
const xrplClient = require("../services/xrplClient");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * @api {get} /api/xrpl/server-info 01. XRPL 서버 정보 조회
 * @apiName GetServerInfo
 * @apiGroup XRPL
 * @apiDescription XRPL 노드의 서버 정보를 반환합니다.
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 서버 정보 (XRPL server_info 응답)
 */
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

/**
 * @api {post} /api/xrpl/wallet 02. 새 지갑 생성 (옵션: 펀딩)
 * @apiName CreateWallet
 * @apiGroup XRPL
 * @apiDescription 새로운 지갑을 생성합니다. fund=true 시 테스트넷 파우셋으로 펀딩을 시도합니다.
 *
 * @apiBody {Boolean} [fund=false] 테스트넷 펀딩 여부
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 지갑 정보
 * @apiSuccess {String} data.address 주소
 * @apiSuccess {String} data.seed 시드
 * @apiSuccess {String} data.publicKey 공개키
 * @apiSuccess {Boolean} data.funded 펀딩 여부
 */
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

/**
 * @api {get} /api/xrpl/account/:address 03. 계정 정보 조회
 * @apiName XRPLGetAccountInfo
 * @apiGroup XRPL
 * @apiDescription XRPL 계정의 상세 정보를 조회합니다.
 *
 * @apiParam {String} address XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 계정 정보 (원장 조회 결과)
 */
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

/**
 * @api {get} /api/xrpl/account/:address/balance 04. 계정 잔액 조회
 * @apiName XRPLGetAccountBalance
 * @apiGroup XRPL
 * @apiDescription XRPL 계정 잔액을 조회합니다.
 *
 * @apiParam {String} address XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 잔액 정보
 * @apiSuccess {String} data.address 주소
 * @apiSuccess {String} data.balance 잔액 (문자열)
 * @apiSuccess {Number} data.balanceXRP 잔액 (XRP)
 */
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

/**
 * @api {post} /api/xrpl/send-payment 05. 결제 전송
 * @apiName XRPLSendPayment
 * @apiGroup XRPL
 * @apiDescription 지갑 시드로 서명하여 지정 주소로 XRP를 전송합니다.
 *
 * @apiBody {String} toAddress 수신자 XRPL 주소
 * @apiBody {Number|String} amount 전송 금액 (XRP)
 * @apiBody {String} fromWalletSeed 송신자 지갑 시드
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 전송 결과
 * @apiSuccess {String} data.transactionHash 트랜잭션 해시
 * @apiSuccess {String} data.fromAddress 송신자 주소
 * @apiSuccess {String} data.toAddress 수신자 주소
 * @apiSuccess {Number|String} data.amount 전송 금액 (XRP)
 * @apiSuccess {Boolean} data.validated 원장 검증 여부
 */
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

/**
 * @api {get} /api/xrpl/transaction/:hash 06. 트랜잭션 상세 조회
 * @apiName XRPLGetTransaction
 * @apiGroup XRPL
 * @apiDescription 트랜잭션 해시로 상세 정보를 조회합니다.
 *
 * @apiParam {String} hash 트랜잭션 해시
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 트랜잭션 상세 (원장 조회 결과)
 */
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

/**
 * @api {post} /api/xrpl/fund-wallet/:address 07. 지갑 펀딩 (테스트넷)
 * @apiName XRPLFundWallet
 * @apiGroup XRPL
 * @apiDescription 테스트넷 파우셋으로 지정 주소에 펀딩을 요청합니다.
 *
 * @apiParam {String} address XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 펀딩 결과 (faucet 응답)
 */
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

/**
 * @api {get} /api/xrpl/validate-address/:address 08. 주소 유효성 검사
 * @apiName XRPLValidateAddress
 * @apiGroup XRPL
 * @apiDescription XRPL 주소 유효성을 검사합니다.
 *
 * @apiParam {String} address 검사할 XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 결과 데이터
 * @apiSuccess {String} data.address 입력 주소
 * @apiSuccess {Boolean} data.isValid 유효 여부
 */
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

/**
 * @api {post} /api/xrpl/validate-seed 09. 시드 유효성 검사
 * @apiName XRPLValidateSeed
 * @apiGroup XRPL
 * @apiDescription 시드 유효성 검사 및 유효 시 주소 반환.
 *
 * @apiBody {String} seed 검사할 시드
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 결과 데이터
 * @apiSuccess {Boolean} data.isValid 유효 여부
 * @apiSuccess {String} [data.address] 유효 시 주소
 * @apiSuccess {String} [data.error] 오류 메시지
 */
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

/**
 * @api {get} /api/xrpl/account/:address/transactions 10. 트랜잭션 내역 조회
 * @apiName XRPLGetTransactions
 * @apiGroup XRPL
 * @apiDescription 계정의 트랜잭션 내역을 조회합니다. (새 스키마 적용)
 *
 * @apiParam {String} address XRPL 주소
 * @apiParam {Number} [limit=20] 최대 개수 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 조회 결과 (구현된 스키마 참고)
 */
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
