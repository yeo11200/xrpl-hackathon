const express = require("express");
const paymentService = require("../services/paymentService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * @api {post} /api/payment/request 01. 결제 요청 생성
 * @apiName CreatePaymentRequest
 * @apiGroup Payment
 * @apiDescription 상점 주소로 결제 요청을 생성합니다. 30분 뒤 만료됩니다.
 *
 * @apiBody {Number} amount 결제 금액 (XRP)
 * @apiBody {String} [description] 결제 설명
 * @apiBody {String} merchantAddress 상점 XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 결제 요청 정보
 * @apiSuccess {String} data.id 결제 요청 ID
 * @apiSuccess {Number} data.amount 결제 금액 (XRP)
 * @apiSuccess {String} data.description 결제 설명
 * @apiSuccess {String} data.merchantAddress 상점 주소
 * @apiSuccess {String="pending"} data.status 결제 요청 상태
 * @apiSuccess {String} data.createdAt 생성 시각 (ISO 8601)
 * @apiSuccess {String} data.updatedAt 갱신 시각 (ISO 8601)
 * @apiSuccess {String} data.expiresAt 만료 시각 (ISO 8601)
 *
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "8a2f0c2e-3d2b-4f2a-9a3f-1b2c3d4e5f6a",
 *     "amount": 10,
 *     "description": "Coffee",
 *     "merchantAddress": "rXXXXXXXXXXXXXXXXXXXX",
 *     "status": "pending",
 *     "createdAt": "2025-09-09T12:00:00.000Z",
 *     "updatedAt": "2025-09-09T12:00:00.000Z",
 *     "expiresAt": "2025-09-09T12:30:00.000Z"
 *   }
 * }
 */
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

/**
 * @api {post} /api/payment/process 02. 결제 처리
 * @apiName ProcessPayment
 * @apiGroup Payment
 * @apiDescription 생성된 결제 요청을 고객 지갑으로 송금해 결제합니다.
 *
 * @apiBody {String} paymentId 결제 요청 ID
 * @apiBody {String} customerWalletSeed 고객 지갑 시드
 * @apiBody {String} customerAddress 고객 XRPL 주소 (시드와 일치해야 함)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 결제 처리 결과
 * @apiSuccess {String} data.paymentId 결제 요청 ID
 * @apiSuccess {String="completed"} data.status 결제 상태
 * @apiSuccess {String} data.transactionHash 트랜잭션 해시
 * @apiSuccess {Number} data.amount 결제 금액 (XRP)
 * @apiSuccess {String} data.merchantAddress 상점 주소
 * @apiSuccess {String} data.customerAddress 고객 주소
 *
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "paymentId": "8a2f0c2e-3d2b-4f2a-9a3f-1b2c3d4e5f6a",
 *     "status": "completed",
 *     "transactionHash": "ABCD...1234",
 *     "amount": 10,
 *     "merchantAddress": "rMERCHANT...",
 *     "customerAddress": "rCUSTOMER..."
 *   }
 * }
 */
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

/**
 * @api {get} /api/payment/status/:paymentId 03. 결제 상태 조회
 * @apiName GetPaymentStatus
 * @apiGroup Payment
 * @apiDescription 결제 요청의 현재 상태와(완료 시) 트랜잭션 정보를 조회합니다.
 *
 * @apiParam {String} paymentId 결제 요청 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 결제 요청 상세
 * @apiSuccess {String} data.id 결제 요청 ID
 * @apiSuccess {Number} data.amount 금액 (XRP)
 * @apiSuccess {String} data.description 설명
 * @apiSuccess {String} data.merchantAddress 상점 주소
 * @apiSuccess {String="pending","completed","expired","refunded"} data.status 상태
 * @apiSuccess {String} data.createdAt 생성 시각
 * @apiSuccess {String} data.updatedAt 갱신 시각
 * @apiSuccess {String} [data.expiresAt] 만료 시각 (pending 상태)
 * @apiSuccess {String} [data.transactionHash] 결제 트랜잭션 해시 (completed 상태)
 * @apiSuccess {String} [data.customerAddress] 고객 주소 (completed 상태)
 * @apiSuccess {String} [data.completedAt] 결제 완료 시각 (completed 상태)
 * @apiSuccess {String} [data.refundHash] 환불 트랜잭션 해시 (refunded 상태)
 * @apiSuccess {String} [data.refundedAt] 환불 완료 시각 (refunded 상태)
 * @apiSuccess {Object} [data.transactionDetails] 원장 트랜잭션 상세 (가능한 경우)
 */
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

/**
 * @api {post} /api/payment/refund 04. 결제 환불
 * @apiName RefundPayment
 * @apiGroup Payment
 * @apiDescription 완료된 결제를 고객에게 환불합니다.
 *
 * @apiBody {String} paymentId 결제 요청 ID
 * @apiBody {String} merchantWalletSeed 상점 지갑 시드
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 환불 결과
 * @apiSuccess {String} data.paymentId 결제 요청 ID
 * @apiSuccess {String="refunded"} data.status 환불 상태
 * @apiSuccess {String} data.refundHash 환불 트랜잭션 해시
 * @apiSuccess {Number} data.amount 환불 금액 (XRP)
 * @apiSuccess {String} data.customerAddress 고객 주소
 */
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

/**
 * @api {get} /api/payment/history 05. 결제 내역 조회
 * @apiName GetPaymentHistory
 * @apiGroup Payment
 * @apiDescription 주소 기준 결제 내역을 유형별로 조회합니다.
 *
 * @apiParam {String} address 조회할 XRPL 주소 (query)
 * @apiParam {String="all","sent","received","pending"} [type=all] 조회 유형 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 조회 결과
 * @apiSuccess {String} data.address 조회 주소
 * @apiSuccess {String} data.type 조회 유형
 * @apiSuccess {Object[]} data.payments 결제 배열 (최신순)
 * @apiSuccess {String} data.payments.id 결제 ID
 * @apiSuccess {Number} data.payments.amount 금액 (XRP)
 * @apiSuccess {String} data.payments.description 설명
 * @apiSuccess {String} data.payments.merchantAddress 상점 주소
 * @apiSuccess {String} [data.payments.customerAddress] 고객 주소
 * @apiSuccess {String="pending","completed","expired","refunded"} data.payments.status 상태
 * @apiSuccess {String} data.payments.createdAt 생성 시각
 * @apiSuccess {String} data.payments.updatedAt 갱신 시각
 * @apiSuccess {String} [data.payments.expiresAt] 만료 시각 (pending)
 * @apiSuccess {String} [data.payments.transactionHash] 결제 트랜잭션 해시 (completed)
 * @apiSuccess {String} [data.payments.completedAt] 완료 시각 (completed)
 * @apiSuccess {String} [data.payments.refundHash] 환불 트랜잭션 해시 (refunded)
 * @apiSuccess {String} [data.payments.refundedAt] 환불 시각 (refunded)
 * @apiSuccess {Number} data.count 반환 개수
 */
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

/**
 * @api {get} /api/payment/validate-address/:address 06. 주소 유효성 검사
 * @apiName ValidatePaymentAddress
 * @apiGroup Payment
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

/**
 * @api {post} /api/payment/validate-seed 07. 시드 유효성 검사
 * @apiName ValidateSeed
 * @apiGroup Payment
 * @apiDescription 지갑 시드 유효성을 검사하고 유효하면 주소를 반환합니다.
 *
 * @apiBody {String} seed 검사할 시드
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 결과 데이터
 * @apiSuccess {Boolean} data.isValid 유효 여부
 * @apiSuccess {String} [data.address] 유효 시 해당 주소
 * @apiSuccess {String} [data.error] 오류 메시지 (무효 시)
 */
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

/**
 * @api {get} /api/payment/stats 08. 결제 통계 조회
 * @apiName GetPaymentStats
 * @apiGroup Payment
 * @apiDescription 주소 기준 결제 통계를 조회합니다.
 *
 * @apiParam {String} address 조회할 XRPL 주소 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 통계 데이터
 * @apiSuccess {String} data.address 조회 주소
 * @apiSuccess {Number} data.totalPayments 전체 결제 수
 * @apiSuccess {Number} data.completedPayments 완료 결제 수
 * @apiSuccess {Number} data.pendingPayments 대기 중 결제 수
 * @apiSuccess {Number} data.totalSent 보낸 총액 (XRP)
 * @apiSuccess {Number} data.totalReceived 받은 총액 (XRP)
 * @apiSuccess {Number} data.netAmount 순액 (received - sent)
 */
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
