const xrpl = require("xrpl");
const logger = require("../utils/logger");
const xrplClient = require("./xrplClient");

/**
 * 계정 관리 서비스
 * React 훅에서 백엔드 서비스로 변환된 버전
 */
class AccountService {
  constructor() {
    this.accounts = new Map(); // 메모리 기반 계정 저장소 (개발용)
  }

  validateAddress(address) {
    if (!address || typeof address !== "string") {
      throw new Error("유효한 주소가 필요합니다");
    }
    const cleanAddress = address.trim();
    if (!xrplClient.constructor.isValidAddress(cleanAddress)) {
      throw new Error("유효한 XRPL 주소 형식이 아닙니다");
    }
    return cleanAddress;
  }

  validateSeed(seed) {
    try {
      const wallet = xrplClient.constructor.walletFromSeed(seed);
      return { isValid: true, address: wallet.address };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * 새 계정 생성 및 테스트넷 펀딩
   * @param {string} nickname - 사용자 닉네임
   * @returns {Promise<Object>} 생성 결과
   */
  async createAccount(nickname) {
    try {
      logger.info("새 계정 생성 시작...");


      // 새 지갑 생성

      const wallet = xrplClient.constructor.generateWallet();
      logger.info(`지갑 생성 완료: ${wallet.address}`);

      // 테스트넷에서 계정 펀딩
      const fundResult = await xrplClient.fundWallet(wallet);
      logger.info(`계정 펀딩 완료: ${fundResult.balance} XRP`);

      const newAccount = {
        address: wallet.address,
        secret: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        balance: fundResult.balance,
        userId: nickname,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 메모리에 저장
      this.accounts.set(wallet.address, newAccount);

      logger.info(`계정 생성 및 설정 완료: ${newAccount.address}`);

      return {
        success: true,
        account: newAccount,
      };
    } catch (error) {
      logger.error("계정 생성 실패:", error.message);
      return {
        success: false,
        message: error.message,
        account: null,
      };
    }
  }

  /**
   * 계정 정보 조회 및 업데이트
   * @param {string} address - 조회할 계정 주소
   * @returns {Promise<Object>} 조회 결과
   */
  async getAccountInfo(address) {
    try {
      const validAddress = this.validateAddress(address);

      const response = await xrplClient.request({
        command: "account_info",
        account: validAddress,
        ledger_index: "validated",
      });

      const accountData = response.result.account_data;
      const accountInfo = {
        address: validAddress,
        balance: parseFloat(xrplClient.constructor.dropsToXrp(accountData.Balance)),
        //balanceXRP: parseFloat(xrplClient.constructor.dropsToXrp(accountData.Balance)),
        //sequence: accountData.Sequence,
        //ownerCount: accountData.OwnerCount,
        //flags: accountData.Flags,
        updatedAt: new Date().toISOString(),
      };

      // 저장된 계정 정보 업데이트
      const storedAccount = this.accounts.get(validAddress);
      if (storedAccount) {
        const updatedAccount = { ...storedAccount, ...accountInfo };
        this.accounts.set(validAddress, updatedAccount);
      }

      const returnAccount = this.accounts.get(validAddress);

      logger.info(`계정 정보 조회 완료: ${validAddress}`);
      return {
        success: true,
        account: returnAccount,
      };
    } catch (error) {
      if (error.message.includes("actNotFound")) {
        logger.warn(`존재하지 않는 계정: ${address}`);
        return {
          success: false,
          message: "존재하지 않는 계정입니다",
          account: null,
          errorType: "ACCOUNT_NOT_FOUND"
        };
      }

      logger.error(`계정 정보 조회 실패 (${address}):`, error);
      return {
        success: false,
        message: error.message,
        account: null,
        errorType: "QUERY_ERROR"
      };
    }
  }
/**
 * XRP 잔액만 조회
 * @param {string} address - XRPL 주소
 * @returns {Promise<Object>} 잔액 조회 결과
 */
async getBalance(address) {
  try {
    const validAddress = this.validateAddress(address);
    const balance = await xrplClient.getXrpBalance(validAddress);

    return {
      success: true,
      data: {
        address: validAddress,
        balance
      },
      message: "잔액 조회 성공"
    };
  } catch (error) {
    logger.error(`잔액 조회 실패 (${address}):`, error);
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
}

  /**
   * XRP 전송
   * @param {Object} txRequest - 트랜잭션 요청 정보
   * @param {string} txRequest.fromAddress - 송금자 주소
   * @param {string} txRequest.toAddress - 수금자 주소
   * @param {number} txRequest.amount - 전송 금액 (XRP)
   * @param {string} txRequest.secret - 송금자 시크릿
   * @returns {Promise<Object>} 전송 결과
   */
  async sendPayment(txRequest) {
    try {
      const validToAddress = this.validateAddress(txRequest.toAddress);
      const validFromAddress = this.validateAddress(txRequest.fromAddress);

      if (!txRequest.secret) {
        throw new Error("시드값은 필수입니다");
      }

      if (!txRequest.amount || txRequest.amount <= 0) {
        throw new Error("유효한 송금액이 필요합니다");
      }

      logger.info(`XRP 전송 시작: ${txRequest.amount} XRP (${validFromAddress} → ${validToAddress})`);

      const wallet = xrplClient.constructor.walletFromSeed(txRequest.secret);

      // 트랜잭션 준비
      const prepared = await xrplClient.autofill({
        TransactionType: "Payment",
        Account: validFromAddress,
        Amount: xrplClient.constructor.xrpToDrops(txRequest.amount),
        Destination: validToAddress,
        LastLedgerSequence: (await xrplClient.getLedgerIndex()) + 200,
      });

      // 트랜잭션 서명 및 제출
      const signed = wallet.sign(prepared);
      const result = await xrplClient.submitAndWait(signed.tx_blob);

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`XRP 전송 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);
      this.getAccountInfo(txRequest.toAddress);
      this.getAccountInfo(txRequest.fromAddress);
      return {
        success: isSuccess,
        message: isSuccess ? undefined : `트랜잭션 실패: ${transactionResult}`,
        transaction: {
          hash: txResult.hash,
          amount: txRequest.amount,
          fromAddress: validFromAddress,
          toAddress: validToAddress,
          timestamp: new Date().toISOString(),
          status: isSuccess ? "success" : "failed",
        },
      };
    } catch (error) {
      logger.error("XRP 전송 실패:", error);
      return {
        success: false,
        message: error.message,
        transaction: null,
      };
    }
  }

  /**
   * 트랜잭션 내역 조회
   * @param {string} address - 계정 주소
   * @param {number} limit - 조회할 트랜잭션 수 (기본값: 20)
   * @returns {Promise<Object>} 트랜잭션 내역
   */
  async getTransactionHistory(address, limit = 20) {
    try {
      const validAddress = this.validateAddress(address);

      const response = await xrplClient.request({
        command: "account_tx",
        account: validAddress,
        limit: limit,
      });

      const RIPPLE_EPOCH = 946684800;
      const transactions = response.result.transactions
        .filter((tx) => tx.tx)
        .map((tx) => {
          const txObj = tx.tx;
          const meta = tx.meta;
          const isSuccess = meta?.TransactionResult === "tesSUCCESS";

          const rippleTimestamp = txObj.date || Date.now() / 1000;
          const unixTimestamp = (rippleTimestamp + RIPPLE_EPOCH) * 1000;

          return {
            hash: txObj.hash || "",
            amount: typeof txObj.Amount === "string" 
              ? parseFloat(xrplClient.constructor.dropsToXrp(txObj.Amount)) 
              : 0,
            fromAddress: txObj.Account || "",
            toAddress: txObj.Destination || "",
            timestamp: new Date(unixTimestamp).toISOString(),
            status: isSuccess ? "success" : "failed",
            txType: txObj.TransactionType,
            fee: parseFloat(xrplClient.constructor.dropsToXrp(txObj.Fee || 0)),
          };
        });

      logger.info(`트랜잭션 내역 조회 성공: ${validAddress} (${transactions.length}개)`);
      return {
        success: true,
        transactions,
      };
    } catch (error) {
      logger.error(`트랜잭션 내역 조회 실패 (${address}):`, error);
      return {
        success: false,
        message: error.message,
        transactions: [],
      };
    }
  }

  /**
   * 저장된 계정 정보 조회
   * @param {string} address - 계정 주소
   * @returns {Object|null} 저장된 계정 정보
   */
  getStoredAccount(address) {
    return this.accounts.get(address) || null;
  }

  /**
   * 모든 저장된 계정 목록 조회
   * @returns {Array} 계정 목록
   */
  getAllStoredAccounts() {
    return Array.from(this.accounts.values());
  }

  /**
   * 계정 정보 삭제
   * @param {string} address - 삭제할 계정 주소
   * @returns {boolean} 삭제 성공 여부
   */
  deleteAccount(address) {
    const deleted = this.accounts.delete(address);
    if (deleted) {
      logger.info(`계정 삭제 완료: ${address}`);
    }
    return deleted;
  }
}

module.exports = new AccountService();
