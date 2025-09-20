const express = require("express");
const { accountService } = require("../services/accountService");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");
const router = express.Router();

/**
 * @api {post} /api/credential/create 01. Credential 생성
 * @apiName CreateCredential
 * @apiGroup Credential
 * @apiDescription 발급자가 새로운 자격증명을 생성합니다
 *
 * @apiBody {String} issuerSeed 발급자의 시드값
 * @apiBody {String} subjectAddress 피발급자의 XRPL 주소
 * @apiBody {String} credentialType 자격증명 타입 (예: "KYC", "Identity")
 * @apiBody {Number} [expirationHours=24] 만료 시간(시간 단위)
 * @apiBody {String} [uri] 자격증명 관련 URI
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} credential 생성된 자격증명 정보
 * @apiSuccess {String} credential.hash 트랜잭션 해시
 * @apiSuccess {String} credential.credentialType 자격증명 타입
 * @apiSuccess {String} credential.issuerAddress 발급자 주소
 * @apiSuccess {String} credential.subjectAddress 피발급자 주소
 * @apiSuccess {String} credential.expiration 만료 시간
 * @apiSuccess {String} credential.status 상태
 */
router.post("/create", async (req, res, next) => {
  try {
    const { issuerSeed, subjectAddress, credentialType, expirationHours, uri } = req.body;

    if (!issuerSeed || !subjectAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        message: "필수 파라미터가 누락되었습니다: issuerSeed, subjectAddress, credentialType"
      });
    }

    const result = await accountService.createCredential({
      issuerSeed,
      subjectAddress,
      credentialType,
      expirationHours,
      uri
    });

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    next(error);
  }
});

/**
 * @api {post} /api/credential/accept 02. Credential 수락
 * @apiName AcceptCredential
 * @apiGroup Credential
 * @apiDescription 피발급자가 자격증명을 수락합니다
 *
 * @apiBody {String} subjectSeed 피발급자의 시드값
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} transaction 트랜잭션 정보
 */
router.post("/accept", async (req, res, next) => {
  try {
    const { subjectSeed } = req.body;

    if (!subjectSeed) {
      return res.status(400).json({
        success: false,
        message: "필수 파라미터가 누락되었습니다: subjectSeed"
      });
    }

    const result = await accountService.acceptCredential({
      subjectSeed,
      credentialType: process.env.CRED_TYPE  // 키:값 형태로 수정
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    next(error);
  }
});

/**
 * @api {delete} /api/credential/delete 03. Credential 삭제
 * @apiName DeleteCredential
 * @apiGroup Credential
 * @apiDescription 피발급자가 본인의 자격증명을 삭제합니다
 *
 * @apiBody {String} subjectSeed 피발급자의 시드값
 * @apiBody {String} issuerAddress 발급자의 XRPL 주소
 * @apiBody {String} credentialType 자격증명 타입
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} transaction 트랜잭션 정보
 */
router.delete("/delete", async (req, res, next) => {
  try {
    const { subjectSeed, issuerAddress, credentialType } = req.body;

    if (!subjectSeed || !issuerAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        message: "필수 파라미터가 누락되었습니다: subjectSeed, issuerAddress, credentialType"
      });
    }

    const result = await accountService.deleteCredential({
      subjectSeed,
      issuerAddress,
      credentialType
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    next(error);
  }
});

/**
 * @api {post} /api/credential/check 04. Credentials 조회
 * @apiName CheckCredentials
 * @apiGroup Credential
 * @apiDescription 특정 계정의 모든 자격증명을 조회합니다
 *
 * @apiBody {String} accountSeed 조회할 계정의 시드값
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Array} credentials 자격증명 목록
 * @apiSuccess {String} account 계정 주소
 * @apiSuccess {String} message 결과 메시지
 */
router.post("/check", async (req, res, next) => {
  try {
    const { accountSeed } = req.body;

    if (!accountSeed) {
      return res.status(400).json({
        success: false,
        message: "필수 파라미터가 누락되었습니다: accountSeed"
      });
    }

    const result = await accountService.checkCredentials({
      accountSeed
    });

    res.status(200).json(result);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
