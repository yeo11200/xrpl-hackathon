const express = require("express");
const {accountService} = require("../services/accountService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();


// 새 계정 생성
/**
 * @api {post} /api/account/create 01. XRPL 계정 생성
 * @apiName CreateAccount
 * @apiGroup Account
 * @apiDescription XRPL 계정을 새로 생성합니다.
 * 
 * @apiBody {String} nickname 생성할 계정의 닉네임 (필수)
 * 
 * @apiParamExample {json} Request-Example:
 * {
 *   "nickname": "arum"
 * }
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 생성된 계정 정보
 * @apiSuccess {String} data.address XRPL 계정 주소
 * @apiSuccess {String} data.secret 계정 시크릿 키
 * @apiSuccess {String} data.publicKey 공개키 (ED25519)
 * @apiSuccess {String} data.privateKey 개인키 (ED25519)
 * @apiSuccess {Number} data.balance 잔액 (drops)
 * @apiSuccess {Number} data.balanceXRP 잔액 (XRP)
 * @apiSuccess {String} data.userId 사용자 닉네임
 * @apiSuccess {String} data.createdAt 계정 생성 시간 (ISO 8601)
 * @apiSuccess {String} data.updatedAt 계정 정보 갱신 시간 (ISO 8601)
 * @apiSuccess {Number} data.sequence 현재 시퀀스 번호
 * @apiSuccess {Number} data.ownerCount 소유자 카운트
 * @apiSuccess {Number} data.flags 계정 플래그 비트마스크
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "address": "rsBiA9B2cMRcJxgckovEFJKcWwK2fJrxBT",
 *     "secret": "sEdTMJ8gCFnXBHAQVmiwXoofgLVACVj",
 *     "publicKey": "EDED77B2C9E41D71F7C4C8393F7450053BD24151CC0A16C3D7DF5B3E431352C12D",
 *     "privateKey": "EDAC9DE80BE58BA2D92166DFB3105DCBD21438BAAD70109EB36F3F1DAFC93BE020",
 *     "balance": 10000000,
 *     "balanceXRP": 10,
 *     "userId": "arum",
 *     "createdAt": "2025-09-09T12:38:31.260Z",
 *     "updatedAt": "2025-09-09T12:38:32.544Z",
 *     "sequence": 10478821,
 *     "ownerCount": 0,
 *     "flags": 0
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 유형
 * @apiError {String} message 오류 메시지
 * 
 * @apiErrorExample {json} Error-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "Validation Error",
 *   "message": "닉네임은 최소 2자 이상이어야 합니다"
 * }
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
 * @api {get} /api/account/:address 02. XRPL 계정 정보 조회
 * @apiName GetAccountInfo
 * @apiGroup Account
 * @apiDescription XRPL 계정의 상세 정보를 조회합니다.
 * 
 * @apiParam {String} address 조회할 XRPL 계정의 주소 (필수)
 * 
 * @apiParamExample {String} Request-Example:
 * GET /api/account/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data XRPL 계정 정보
 * @apiSuccess {String} data.address XRPL 계정 주소
 * @apiSuccess {String} [data.secret] 계정 시크릿 키 (저장된 계정인 경우)
 * @apiSuccess {String} [data.publicKey] 공개키 (저장된 계정인 경우)
 * @apiSuccess {String} [data.privateKey] 개인키 (저장된 계정인 경우)
 * @apiSuccess {Number} data.balance 잔액 (drops)
 * @apiSuccess {Number} data.balanceXRP 잔액 (XRP)
 * @apiSuccess {String} [data.userId] 사용자 닉네임/ID (저장된 계정인 경우)
 * @apiSuccess {String} [data.createdAt] 계정 생성 시간 (ISO 8601, 저장된 계정인 경우)
 * @apiSuccess {String} data.updatedAt 계정 정보 갱신 시간 (ISO 8601)
 * @apiSuccess {Number} data.sequence 현재 시퀀스 번호
 * @apiSuccess {Number} data.ownerCount 소유자 카운트
 * @apiSuccess {Number} data.flags 계정 플래그 비트마스크
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "address": "rDyWBfWzoB8QjvMm81ykMLAXVgG4uQXRKH",
 *     "secret": "sEdSYFoyg3H2BfVHKfbbQMcsWLPg5pX",
 *     "publicKey": "ED1A9F1B93A22EE0524C961B0D6A0774BB29DFBE91653ED8437B74716D1DE1419B",
 *     "privateKey": "EDAFD40D94D17643BAEDEF29BE06B0666D5CDC329B8223DA117A69AA97F1246570",
 *     "balance": 10000000,
 *     "balanceXRP": 10,
 *     "userId": "arum",
 *     "createdAt": "2025-09-09T12:42:09.498Z",
 *     "updatedAt": "2025-09-09T12:42:21.053Z",
 *     "sequence": 10478890,
 *     "ownerCount": 0,
 *     "flags": 0
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 메시지
 * @apiError {String} errorType 오류 유형
 * 
 * @apiErrorExample {json} Account-Not-Found:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Account not found",
 *   "errorType": "ACCOUNT_NOT_FOUND"
 * }
 * 
 * @apiErrorExample {json} Server-Error:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "error": "Internal server error",
 *   "errorType": "QUERY_ERROR"
 * }
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

/**
 * @api {get} /api/account/balance/:address 03. XRPL 계정 잔액 조회
 * @apiName GetAccountBalance
 * @apiGroup Account
 * @apiDescription XRPL 계정의 잔액을 조회합니다.
 * 
 * @apiParam {String} address XRP Ledger 주소 (필수)
 * 
 * @apiParamExample {String} Request-Example:
 * GET /api/account/balance/rXXXXXXXXXXXXXXXXXXXX
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 잔액 정보
 * @apiSuccess {String} data.address XRPL 계정 주소
 * @apiSuccess {Number} data.balance 잔액 (drops)
 * @apiSuccess {Number} data.balanceXRP 잔액 (XRP)
 * @apiSuccess {String} message 성공 메시지
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "address": "rftQasufgVB4grJpn1vki7HSusSvws28WD",
 *     "balance": 10000000,
 *     "balanceXRP": 10
 *   },
 *   "message": "잔액 조회 성공"
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} message 오류 메시지
 * 
 * @apiErrorExample {json} Invalid-Address:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "message": "유효하지 않은 주소입니다"
 * }
 * 
 * @apiErrorExample {json} Server-Error:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "message": "서버 내부 오류"
 * }
 */
router.get("/balance/:address", async (req, res) => {
  const { address } = req.params;
  const result = await accountService.getBalance(address);
  res.status(result.success ? 200 : 400).json(result);
});

// 모든 저장된 계정 조회
/**
 * @api {get} /api/account/ 04. 저장된 모든 XRPL 계정 목록 조회
 * @apiName GetAllStoredAccounts
 * @apiGroup Account
 * @apiDescription 시스템에 저장된 모든 XRPL 계정 목록을 조회합니다.
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 조회 결과 데이터
 * @apiSuccess {Object[]} data.accounts 저장된 XRPL 계정 배열
 * @apiSuccess {String} data.accounts.address XRPL 계정 주소
 * @apiSuccess {String} data.accounts.secret 계정 시크릿 키
 * @apiSuccess {String} data.accounts.publicKey 공개키 (ED25519)
 * @apiSuccess {String} data.accounts.privateKey 개인키 (ED25519)
 * @apiSuccess {Number} data.accounts.balance 잔액 (drops)
 * @apiSuccess {Number} data.accounts.balanceXRP 잔액 (XRP)
 * @apiSuccess {String} data.accounts.userId 사용자 ID
 * @apiSuccess {String} data.accounts.createdAt 계정 생성 시간 (ISO 8601)
 * @apiSuccess {String} data.accounts.updatedAt 계정 수정 시간 (ISO 8601)
 * @apiSuccess {Number} data.accounts.sequence 현재 시퀀스 번호
 * @apiSuccess {Number} data.accounts.ownerCount 소유자 카운트
 * @apiSuccess {Number} data.accounts.flags 계정 플래그 비트마스크
 * @apiSuccess {Number} data.count 저장된 계정 개수
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "accounts": [
 *       {
 *         "address": "rDsyHNxHVKybpGsprNiL7xyU1ZGSZN5jCA",
 *         "secret": "sEdTMuuFFPkBkWF95pUjGW2PTa53ojx",
 *         "publicKey": "ED0ACD6F0740EB2373B01678A133E7AF0EFB967C7E432C27517F989116284CEC04",
 *         "privateKey": "ED14F707F9AB834FC70CBF010802C6C7700F88963FE816869972C00C6B34DB9990",
 *         "balance": 10000000,
 *         "balanceXRP": 10,
 *         "userId": "arum",
 *         "createdAt": "2025-09-09T12:46:23.812Z",
 *         "updatedAt": "2025-09-09T12:46:24.996Z",
 *         "sequence": 10478973,
 *         "ownerCount": 0,
 *         "flags": 0
 *       },
 *       {
 *         "address": "rpzc5JR8TEib8mDvRuo8Z4ymuQEWBHvuB5",
 *         "secret": "sEd7yxaXKRWKiYt9u8vvmrFdWH9mHJL",
 *         "publicKey": "EDFC496BC4D89142CAF1CB282C1416BA669709F8B6F3941551865D98804709E512",
 *         "privateKey": "ED713AC196CFA9C4A95068092C83B03F88509B98DBBDD548077A5628821E5B4C2E",
 *         "balance": 10000000,
 *         "balanceXRP": 10,
 *         "userId": "junil",
 *         "createdAt": "2025-09-09T12:46:54.039Z",
 *         "updatedAt": "2025-09-09T12:46:54.229Z",
 *         "sequence": 10478983,
 *         "ownerCount": 0,
 *         "flags": 0
 *       }
 *     ],
 *     "count": 2
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 메시지
 * 
 * @apiErrorExample {json} Server-Error:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "error": "Internal server error"
 * }
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

// XRP 전송
/**
 * @api {post} /api/account/:address/send 05. XRP 전송
 * @apiName SendXRP
 * @apiGroup Account
 * @apiDescription 송금자 XRPL 계정에서 수신자 계정으로 XRP를 전송합니다.
 * 
 * @apiParam {String} address 송금자(소유자) XRPL 계정 주소 (URL path parameter)
 * @apiBody {String} toAddress 수신자 XRPL 계정 주소 (필수)
 * @apiBody {Number} amount 전송할 XRP 양 (Drop 단위 아님, XRP 단위) (필수)
 * 
 * @apiParamExample {json} Request-Example:
 * POST /api/account/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH/send
 * {
 *   "toAddress": "rs8dupWr8dA9cntGP1UoxSwzf3dzabYfgJ",
 *   "amount": 50
 * }
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 전송 결과 트랜잭션 정보
 * @apiSuccess {String} data.hash 트랜잭션 해시
 * @apiSuccess {Number} data.amount 전송된 XRP 양
 * @apiSuccess {String} data.fromAddress 송신자 주소
 * @apiSuccess {String} data.toAddress 수신자 주소
 * @apiSuccess {String} data.timestamp 발생 시간 (ISO 8601)
 * @apiSuccess {String="success","failed"} data.status 트랜잭션 상태
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "hash": "5D8EA63249FE013095E038C2D4A72513AB31D202128E38887C3698353648D299",
 *     "amount": 1,
 *     "fromAddress": "rfvKkQNUvwTa1ccTxEmnYuCnGaw1HPy7H7",
 *     "toAddress": "rwZ8uEYzRGq83QV4FotXh2YCQ6z3uA4zT7",
 *     "timestamp": "2025-09-09T12:51:42.308Z",
 *     "status": "success"
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 메시지
 * 
 * @apiErrorExample {json} Insufficient-Balance:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "Insufficient balance"
 * }
 * 
 * @apiErrorExample {json} Account-Not-Found:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Account not found in storage"
 * }
 * 
 * @apiErrorExample {json} Server-Error:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "error": "Internal server error"
 * }
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
 * @api {get} /api/account/:address/transactions 06. 계정의 트랜잭션 내역 조회
 * @apiName GetTransactionHistory
 * @apiGroup Account
 * @apiDescription 특정 XRPL 계정의 트랜잭션 내역을 조회합니다.
 * 
 * @apiParam {String} address 조회할 XRPL 계정 주소 (URL path parameter)
 * @apiParam {Number} [limit=20] 반환할 트랜잭션 최대 개수 (1-100, 기본값: 20)
 * 
 * @apiParamExample {String} Request-Example:
 * GET /api/account/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH/transactions?limit=20
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 조회 결과 데이터
 * @apiSuccess {String} data.address 조회한 XRPL 계정 주소
 * @apiSuccess {Object[]} data.transactions 트랜잭션 배열
 * @apiSuccess {String} data.transactions.hash 트랜잭션 해시
 * @apiSuccess {Number} data.transactions.amount 금액 (XRP)
 * @apiSuccess {String} data.transactions.fromAddress 송신자 주소
 * @apiSuccess {String} data.transactions.toAddress 수신자 주소
 * @apiSuccess {String} data.transactions.timestamp 발생 시간 (ISO 8601)
 * @apiSuccess {String="success","failed"} data.transactions.status 트랜잭션 상태
 * @apiSuccess {String} data.transactions.txType 트랜잭션 종류 (Payment 등)
 * @apiSuccess {Number} data.transactions.fee 수수료 (XRP)
 * @apiSuccess {Number} data.count 반환된 트랜잭션 개수
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "address": "rwZ8uEYzRGq83QV4FotXh2YCQ6z3uA4zT7",
 *     "transactions": [
 *       {
 *         "hash": "5D8EA63249FE013095E038C2D4A72513AB31D202128E38887C3698353648D299",
 *         "amount": 1,
 *         "fromAddress": "rfvKkQNUvwTa1ccTxEmnYuCnGaw1HPy7H7",
 *         "toAddress": "rwZ8uEYzRGq83QV4FotXh2YCQ6z3uA4zT7",
 *         "timestamp": "2025-09-09T12:51:41.000Z",
 *         "status": "success",
 *         "txType": "Payment",
 *         "fee": 0.000012
 *       },
 *       {
 *         "hash": "7ABC9957ED66CE23BCA1E27C2D8F6B997516908E4AC3DB55B955901CF66D7A6B",
 *         "amount": 10,
 *         "fromAddress": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
 *         "toAddress": "rwZ8uEYzRGq83QV4FotXh2YCQ6z3uA4zT7",
 *         "timestamp": "2025-09-09T12:50:32.000Z",
 *         "status": "success",
 *         "txType": "Payment",
 *         "fee": 0.000012
 *       }
 *     ],
 *     "count": 2
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 메시지
 * 
 * @apiErrorExample {json} Invalid-Address:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "Invalid account address"
 * }
 * 
 * @apiErrorExample {json} Server-Error:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "error": "Internal server error"
 * }
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

module.exports = router;
