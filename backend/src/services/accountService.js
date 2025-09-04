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

  /**
   * 새 계정 생성 및 테스트넷 펀딩
   * @param {string} nickname - 사용자 닉네임
   * @returns {Promise<Object>} 생성 결과
   */
  async createAccount(nickname) {
    try {
      logger.info("새 계정 생성 시작...");

      const client = await xrplClient.getClient();
      if (!client) {
        throw new Error("XRPL 클라이언트가 초기화되지 않았습니다.");
      }

      // 새 지갑 생성
      const wallet = xrpl.Wallet.generate();
      logger.info(`지갑 생성 완료: ${wallet.address}`);

      // 테스트넷에서 계정 펀딩
      const fundResult = await client.fundWallet(wallet);
      logger.info(`계정 펀딩 완료: ${fundResult.balance} XRP`);

      const newAccount = {
        address: wallet.address,
        secret: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        balance: fundResult.balance.toString(),
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
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      logger.error("계정 생성 실패:", errorMessage);

      return {
        success: false,
        message: errorMessage,
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
      const client = await xrplClient.getClient();
      if (!client) {
        throw new Error("XRPL 클라이언트가 초기화되지 않았습니다.");
      }

      logger.info(`계정 정보 조회 중: ${address}`);

      const response = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });

      const accountInfo = {
        address: address,
        balance: response.result.account_data.Balance,
        sequence: response.result.account_data.Sequence,
        ownerCount: response.result.account_data.OwnerCount,
        flags: response.result.account_data.Flags,
        updatedAt: new Date().toISOString(),
      };

      // 저장된 계정 정보 업데이트
      const storedAccount = this.accounts.get(address);
      if (storedAccount) {
        const updatedAccount = { ...storedAccount, ...accountInfo };
        this.accounts.set(address, updatedAccount);
      }

      logger.info("계정 정보 조회 완료:", {
        address: address,
        balance: xrpl.dropsToXrp(accountInfo.balance) + " XRP",
      });

      return {
        success: true,
        account: accountInfo,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      logger.error("계정 정보 조회 실패:", errorMessage);

      return {
        success: false,
        message: errorMessage,
        account: null,
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
      logger.info(
        "XRP 전송 시작:",
        `${txRequest.amount} XRP (${txRequest.fromAddress} → ${txRequest.toAddress})`
      );

      const client = await xrplClient.getClient();
      if (!client) {
        throw new Error("XRPL 클라이언트가 초기화되지 않았습니다.");
      }

      const wallet = xrpl.Wallet.fromSeed(txRequest.secret);

      // 트랜잭션 준비
      const prepared = await client.autofill({
        TransactionType: "Payment",
        Account: txRequest.fromAddress,
        Amount: xrpl.xrpToDrops(txRequest.amount),
        Destination: txRequest.toAddress,
        LastLedgerSequence: (await client.getLedgerIndex()) + 200,
      });

      // 트랜잭션 서명 및 제출
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`XRP 전송 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);

      return {
        success: isSuccess,
        message: isSuccess
          ? undefined
          : `Transaction failed: ${transactionResult}`,
        transaction: {
          hash: txResult.hash,
          amount: txRequest.amount.toString(),
          fromAddress: txRequest.fromAddress,
          toAddress: txRequest.toAddress,
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
      const client = await xrplClient.getClient();
      if (!client) {
        throw new Error("XRPL 클라이언트가 초기화되지 않았습니다.");
      }

      const response = await client.request({
        command: "account_tx",
        account: address,
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
            amount: typeof txObj.Amount === "string" ? txObj.Amount : "0",
            fromAddress: txObj.Account || "",
            toAddress: txObj.Destination || "",
            timestamp: new Date(unixTimestamp).toISOString(),
            status: isSuccess ? "success" : "failed",
            txType: txObj.TransactionType,
            fee: txObj.Fee || "0",
          };
        });

      logger.info(
        `트랜잭션 내역 조회 성공: ${address} (${transactions.length}개)`
      );
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

  /**
   * 주소 유효성 검증
   * @param {string} address - 검증할 주소
   * @returns {boolean} 유효성 여부
   */
  validateAddress(address) {
    try {
      return xrpl.isValidClassicAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * 시드 유효성 검증
   * @param {string} seed - 검증할 시드
   * @returns {Object} 검증 결과
   */
  validateSeed(seed) {
    try {
      const wallet = xrpl.Wallet.fromSeed(seed);
      return {
        isValid: true,
        address: wallet.address,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }
}

// 싱글톤 인스턴스
const accountService = new AccountService();

module.exports = accountService;
