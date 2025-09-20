const express = require("express");
const {accountService} = require("../services/accountService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

const { supabase } = require("../services/supabaseClient");


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

// 닉네임으로 로그인(주소 조회)
/**
 * @api {get} /api/account/login/:nickname 01-1. 닉네임으로 주소 조회 (로그인)
 * @apiName LoginByNickname
 * @apiGroup Account
 * @apiDescription Supabase accounts 테이블에서 닉네임(user_id)으로 주소를 조회합니다.
 *
 * @apiParam {String} nickname 사용자 닉네임
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 조회 결과
 * @apiSuccess {String} data.address XRPL 계정 주소
 * @apiSuccess {String} data.userId 사용자 닉네임
 *
 * @apiErrorExample {json} Not-Found:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Account not found"
 * }
 */
router.get("/login/:nickname", async (req, res, next) => {
  try {
    const { nickname } = req.params;
    if (!nickname || typeof nickname !== "string") {
      return res.status(400).json({ success: false, error: "Invalid nickname" });
    }

    const { data: row, error } = await supabase
      .from('accounts')
      .select('address,user_id')
      .ilike('user_id', nickname)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    return res.json({
      success: true,
      data: { address: row.address, userId: row.user_id }
    });
  } catch (err) {
    return next(err);
  }
});

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
    const accounts = await accountService.getAllStoredAccounts();
    res.json({
      success: true,
      data: {
        accounts,
        count: Array.isArray(accounts) ? accounts.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// XRP 전송
/**
 * @api {post} /api/account/:address/send 07. XRP 전송
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

      // 1) DB에 송신자 주소가 존재하는지 검증
      const { data: accountRow, error: dbError } = await supabase
        .from('accounts')
        .select('address,user_id,secret')
        .eq('address', address)
        .maybeSingle();
      if (dbError) {
        return res.status(500).json({ success: false, error: dbError.message });
      }
      if (!accountRow) {
        return res.status(404).json({ success: false, error: 'Account not found in database' });
      }

      // 2) DB에서 시크릿 확보 (개발 단계 저장 가정). 없으면 요청 본문에서 대체
      const secret = accountRow.secret || req.body?.secret;
      if (!secret) {
        return res.status(404).json({ success: false, error: 'Secret not available for this address' });
      }

      const txRequest = {
        fromAddress: address,
        toAddress,
        amount: parseFloat(amount),
        secret,
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

// XRP 결제
/**
 * @api {post} /api/account/:address/payment 05. XRP 결제
 * @apiName SendXRPPayment
 * @apiGroup Account
 * @apiDescription 송금자 XRPL 계정에서 관리자 계정으로 XRP를 전송합니다.
 * 
 * @apiParam {String} address 송금자 XRPL 계정 주소 (URL path parameter)
 * @apiBody {Number} amount 전송할 XRP 양 (XRP 단위) (필수)
 * @apiBody {Number} products_id 상품 Id (XRP 단위) (필수)
 * 
 * @apiParamExample {json} Request-Example:
 * {
 *   "amount": 50,
 *   "products_id" : 1
 * }
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 전송 결과 트랜잭션 정보
 * @apiSuccess {String} data.hash 트랜잭션 해시
 * @apiSuccess {Number} data.amount 전송된 XRP 양
 * @apiSuccess {String} data.fromAddress 송신자 주소
 * @apiSuccess {String} data.toAddress 수신자 주소
 * @apiSuccess {String} data.timestamp 발생 시간
 * @apiSuccess {String} data.status 트랜잭션 상태
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "hash": "5D8EA63249FE013095E038C2D4A72513AB31D202128E38887C3698353648D299",
 *     "amount": 50,
 *     "fromAddress": "rfvKkQNUvwTa1ccTxEmnYuCnGaw1HPy7H7",
 *     "toAddress": "rADMIN123...",
 *     "timestamp": "2025-09-20T21:48:00.000Z",
 *     "status": "success"
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 메시지
 * 
 * @apiErrorExample {json} Account-Not-Found:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Account not found in database"
 * }
 * 
 * @apiErrorExample {json} Secret-Missing:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Secret not available for this address"
 * }
 */
router.post("/:address/payment",
  // validateRequest(schemas.sendPaymentFromAccount),
  async (req, res, next) => {
    try {
      const { address } = req.params;
      const { products_id, amount } = req.body;

      // 1) DB에 송신자 주소가 존재하는지 검증
      const { data: accountRow, error: dbError } = await supabase
        .from('accounts')
        .select('address,user_id,secret')
        .eq('address', address)
        .maybeSingle();
      if (dbError) {
        return res.status(500).json({ success: false, error: dbError.message });
      }
      if (!accountRow) {
        return res.status(404).json({ success: false, error: 'Account not found in database' });
      }

      // 2) DB에서 시크릿 확보
      const secret = accountRow.secret || req.body?.secret;
      if (!secret) {
        return res.status(404).json({ success: false, error: 'Secret not available for this address' });
      }

      // 3) 상품 정보 조회
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', products_id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return res.status(404).json({ 
          success: false, 
          error: 'Product not found or inactive' 
        });
      }

      // 4) 재고 확인
      if (product.stock <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product out of stock' 
        });
      }

      const toAddress = await accountService.getAdminAddress();
    
      // 7) 성공 시 일반 XRP 결제도 진행 (선택사항)
      const txRequest = {
        fromAddress: address,
        toAddress: toAddress,
        amount: parseFloat(amount),
        secret,
      };

      const paymentResult = await accountService.sendPayment(txRequest);

      res.json({
        success: true,
        data: {
          payment: paymentResult.success ? paymentResult.transaction : null,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// XRP DEX OFFER 검증
/**
 * @api {post} /api/account/:address/validation 05-1. XRP 검증
 * @apiName ValidateXRPPayment  
 * @apiGroup Account
 * @apiDescription 송금자 XRPL 계정에서 관리자 계정으로 XRP를 전송 전 검증합니다.
 * 
 * @apiParam {String} address 송금자 XRPL 계정 주소 (URL path parameter)
 * @apiBody {Number} amount 전송할 XRP 양 (XRP 단위) (필수)
 * @apiBody {Number} products_id 상품 Id (XRP 단위) (필수)
 * 
 * @apiParamExample {json} Request-Example:
 * {
 *   "amount": 50,
 *   "products_id" : 1
 * }
 * 
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} data 전송 결과 트랜잭션 정보
 * @apiSuccess {String} data.hash 트랜잭션 해시
 * @apiSuccess {Number} data.amount 전송된 XRP 양
 * @apiSuccess {String} data.fromAddress 송신자 주소
 * @apiSuccess {String} data.toAddress 수신자 주소
 * @apiSuccess {String} data.timestamp 발생 시간
 * @apiSuccess {String} data.status 트랜잭션 상태
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "hash": "5D8EA63249FE013095E038C2D4A72513AB31D202128E38887C3698353648D299",
 *     "amount": 50,
 *     "fromAddress": "rfvKkQNUvwTa1ccTxEmnYuCnGaw1HPy7H7",
 *     "toAddress": "rADMIN123...",
 *     "timestamp": "2025-09-20T21:48:00.000Z",
 *     "status": "success"
 *   }
 * }
 * 
 * @apiError {Boolean} success=false 요청 실패
 * @apiError {String} error 오류 메시지
 * 
 * @apiErrorExample {json} Account-Not-Found:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Account not found in database"
 * }
 * 
 * @apiErrorExample {json} Secret-Missing:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Secret not available for this address"
 * }
 */
router.post("/:address/validation",
  // validateRequest(schemas.sendPaymentFromAccount),
  async (req, res, next) => {
    try {
      const { address } = req.params;
      const { products_id, amount } = req.body;

      // 1) DB에 송신자 주소가 존재하는지 검증
      const { data: accountRow, error: dbError } = await supabase
        .from('accounts')
        .select('address,user_id,secret')
        .eq('address', address)
        .maybeSingle();
      if (dbError) {
        return res.status(500).json({ success: false, error: dbError.message });
      }
      if (!accountRow) {
        return res.status(404).json({ success: false, error: 'Account not found in database' });
      }

      // 2) DB에서 시크릿 확보
      const secret = accountRow.secret || req.body?.secret;
      if (!secret) {
        return res.status(404).json({ success: false, error: 'Secret not available for this address' });
      }

      // 3) 상품 정보 조회
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', products_id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return res.status(404).json({ 
          success: false, 
          error: 'Product not found or inactive' 
        });
      }

      // 4) 재고 확인
      if (product.stock <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product out of stock' 
        });
      }

      const toAddress = await accountService.getAdminAddress();

      // 5) PermissionedDEX OfferCreate 트랜잭션 실행
      const permissionedOfferResult = await createPermissionedOfferForProduct({
        userAddress: address,
        userSeed: secret,
        product: product,
        xrpAmount: parseFloat(amount),
        merchantAddress: toAddress
      });

      // 6) PermissionedDEX 결과 확인
      if (!permissionedOfferResult.success) {
        // 자격증명 부족 또는 권한 없음
        if (permissionedOfferResult.credentialError) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient credentials for this transaction',
            details: permissionedOfferResult.message,
            credentialRequired: 'XPAY_MEMBER'
          });
        }
        
        return res.status(400).json({
          success: false,
          error: permissionedOfferResult.message
        });
      }

      // 7) 성공 시 일반 XRP 결제도 진행 (선택사항)
      // const txRequest = {
      //   fromAddress: address,
      //   toAddress: toAddress,
      //   amount: parseFloat(amount),
      //   secret,
      // };

      // const paymentResult = await accountService.sendPayment(txRequest);

      // res.json({
      //   success: true,
      //   data: {
      //     permissionedOffer: permissionedOfferResult.transaction,
      //     payment: paymentResult.success ? paymentResult.transaction : null,
      //     product: {
      //       id: product.id,
      //       name: product.name,
      //       price: product.price,
      //       category: product.category
      //     }
      //   }
      // });

      // 당초 계획으로는 해당 API를 통해 검증 및 결제를 한번에 하려고 하였으나, 테스트 부족으로 인해 정상적인 동작이 되지 않고
      // "오퍼 생성 실패: tecUNFUNDED_OFFER - 오퍼를 위한 자금이 부족합니다 (Trust Line 또는 토큰 부족)"와 같은 오류가 발생.
      // 저희 팀은 정상적인 기능 동작을 우선시 하여, 해당 기능을 별도 API로 분리 후 정상 동작이 되도록 해당 API를 실제 기능에서 
      // 예외 처리 후 일반 결제만 추가하여 개발하였습니다. 추후 디벨롭을 통해 해당 기능으로 Credentail 검증 후 결제 기능이 동작하도록 
      // 개발할 예정입니다.

      // test

      return res.status(201).json({
          success: true
        });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * 안전한 토큰 코드 생성
 */
function generateSafeTokenCurrency(productName, productId) {
  let tokenCode = productName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // XRP 및 유사한 코드들 제외
  const reservedCodes = ['XRP', 'BTC', 'ETH', 'USD', 'EUR', 'JPY', 'GBP'];
  
  if (reservedCodes.includes(tokenCode) || tokenCode === 'XRP') {
    // 상품 ID를 이용한 대체 코드 생성
    tokenCode = `P${productId.toString().padStart(2, '0')}`; // P01, P02, ...
  }
  
  // 3글자 미만인 경우 패딩
  if (tokenCode.length < 3) {
    tokenCode = tokenCode.padEnd(3, '0');
  }
  
  return tokenCode;
}

/**
 * 개선된 DEX 오퍼 생성 (자세한 로깅 추가)
 */
async function createPermissionedOfferForProduct({ 
  userAddress, 
  userSeed, 
  product, 
  xrpAmount, 
  merchantAddress 
}) {
  const { Client, Wallet } = require("xrpl");
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    await client.connect();

    const userWallet = Wallet.fromSeed(userSeed);
    
    logger.info(`DEX 오퍼 생성 시작: ${product.name} (사용자: ${userAddress})`);

    // ✅ 계정 잔액 확인
    try {
      const accountInfo = await client.request({
        command: "account_info",
        account: userWallet.address,
        ledger_index: "validated"
      });
      
      const balanceXRP = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
      logger.info(`사용자 잔액: ${balanceXRP} XRP, 필요 금액: ${xrpAmount} XRP`);
      
      if (balanceXRP < xrpAmount + 0.1) { // 수수료 고려
        return {
          success: false,
          message: `잔액 부족: 현재 ${balanceXRP} XRP, 필요 ${xrpAmount + 0.1} XRP`,
          transaction: null
        };
      }
    } catch (balanceError) {
      logger.error("잔액 확인 실패:", balanceError);
      return {
        success: false,
        message: "계정 정보 조회 실패",
        transaction: null
      };
    }

    // 안전한 토큰 코드 생성
    const tokenCurrency = generateSafeTokenCurrency(product.name, product.id);
    const tokenValue = "1";

    logger.info(`생성된 토큰 코드: ${tokenCurrency} (상품: ${product.name})`);

    const offerTx = {
      TransactionType: "OfferCreate",
      Account: userWallet.address,
      TakerPays: (xrpAmount * 1000000).toString(),
      TakerGets: {
        currency: tokenCurrency,
        issuer: merchantAddress,
        value: tokenValue
      },
      Memos: [{
        Memo: {
          MemoType: toHex("PRODUCT_PURCHASE"),
          MemoData: toHex(JSON.stringify({
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            purchaseAmount: xrpAmount,
            tokenCurrency: tokenCurrency
          }))
        }
      }]
    };

    // ✅ 더 자세한 트랜잭션 로깅
    logger.info("DEX 오퍼 트랜잭션 상세:", {
      account: offerTx.Account,
      takerPays: offerTx.TakerPays,
      takerGets: offerTx.TakerGets,
      tokenCurrency: tokenCurrency,
      merchantAddress: merchantAddress
    });

    const prepared = await client.autofill(offerTx);
    logger.info("트랜잭션 autofill 완료. Fee:", prepared.Fee);

    const signed = userWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result;
    const transactionResult = txResult.meta?.TransactionResult;
    const isSuccess = transactionResult === "tesSUCCESS";

    // ✅ 실패 상세 정보 로깅
    if (!isSuccess) {
      logger.error("DEX 오퍼 실패 상세:", {
        hash: txResult.hash,
        transactionResult: transactionResult,
        engineResult: txResult.engine_result,
        engineResultMessage: txResult.engine_result_message,
        meta: txResult.meta
      });
    }

    logger.info(`DEX 오퍼 ${isSuccess ? "성공" : "실패"}: ${txResult.hash} (${transactionResult})`);

    return {
      success: isSuccess,
      credentialError: false,
      hash: txResult.hash,
      message: isSuccess ? 
        "DEX 오퍼가 성공적으로 생성되었습니다" : 
        `오퍼 생성 실패: ${transactionResult} - ${getErrorMessage(transactionResult)}`,
      transaction: {
        hash: txResult.hash,
        userAddress: userWallet.address,
        merchantAddress,
        product: {
          id: product.id,
          name: product.name,
          tokenCurrency,
          tokenValue
        },
        xrpAmount,
        timestamp: new Date().toISOString(),
        status: isSuccess ? "created" : "failed",
        transactionResult,
        errorDetails: !isSuccess ? {
          engineResult: txResult.engine_result,
          engineResultMessage: txResult.engine_result_message
        } : null
      }
    };

  } catch (error) {
    logger.error("DEX 오퍼 생성 실패:", error);
    return {
      success: false,
      credentialError: false,
      message: error.message,
      transaction: null
    };
  } finally {
    await client.disconnect();
  }
}

/**
 * XRPL 오류 코드 해석
 */
function getErrorMessage(transactionResult) {
  const errorMessages = {
    "tecUNFUNDED_OFFER": "오퍼를 위한 자금이 부족합니다 (Trust Line 또는 토큰 부족)",
    "tecNO_LINE_INSUF_RESERVE": "Trust Line 설정을 위한 준비금 부족",
    "tecINSUF_RESERVE_OFFER": "오퍼 생성을 위한 준비금 부족",
    "tecOBJECT_NOT_FOUND": "참조된 객체를 찾을 수 없습니다",
    "tecPATH_DRY": "결제 경로를 찾을 수 없습니다",
    "tefMASTER_DISABLED": "마스터 키가 비활성화되었습니다",
    "telINSUF_FEE_P": "트랜잭션 수수료가 부족합니다",
    "temBAD_CURRENCY": "잘못된 통화 코드입니다",
    "temBAD_ISSUER": "잘못된 발행자 주소입니다"
  };
  
  return errorMessages[transactionResult] || "알 수 없는 오류";
}

/**
 * 문자열을 HEX로 변환
 */
function toHex(str) {
  if (!str) return '';
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
}


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
