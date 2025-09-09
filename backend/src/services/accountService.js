const logger = require("../utils/logger");
const {xrplClient, XRPLClient} = require("./xrplClient");

/**
 * 계정 관리 서비스
 * React 훅에서 백엔드 서비스로 변환된 버전
 */
class AccountService {
  constructor(xrplClient = new XRPLClient()) {
    this.xrplClient = xrplClient;
    this.accounts = new Map(); // 메모리 기반 계정 저장소 (개발용)
  }

  validateAddress(address) {
    const clean = address?.trim();
    if (!clean) throw new Error("주소가 비어있습니다");
    if (!XRPLClient.isValidAddress(clean)) throw new Error("유효한 XRPL 주소 형식이 아닙니다");
    return clean;
  }

  validateSeed(seed) {
    if (!seed || typeof seed !== "string") {
      return { isValid: false, error: "시드값이 비어있거나 잘못된 형식입니다" };
    }

    try {
      const wallet = XRPLClient.walletFromSeed(seed);
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
      if (!nickname || typeof nickname !== "string") {
        throw new Error("닉네임은 필수이며 문자열이어야 합니다");
      }

      logger.info("새 계정 생성 시작...");
      const wallet = XRPLClient.generateWallet();
      logger.info(`지갑 생성 완료: ${wallet.address}`);

      const fundResult = await this.xrplClient.fundWallet(wallet);
      logger.info(`계정 펀딩 완료: ${fundResult.balance} XRP`);

      const newAccount = {
        address: wallet.address,
        secret: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        balance: parseFloat(XRPLClient.xrpToDrops(fundResult.balance))|| 0,
        balanceXRP: fundResult.balance,
        userId: nickname,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.accounts.set(wallet.address, newAccount);
      await this.getAccountInfo(wallet.address);
      const newLoadedAccount = this.accounts.get(wallet.address);
      logger.info(`계정 생성 완료: ${newLoadedAccount.address}`);

      return { success: true, account: newLoadedAccount };
    } catch (error) {
      logger.error("계정 생성 실패:", error);
      return { success: false, message: error.message, account: null };
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
      // 핵심 정보 구성
      const accountInfo = {
        address: validAddress,
        balance: parseFloat(accountData.Balance)|| 0,
        balanceXRP: parseFloat(XRPLClient.dropsToXrp(accountData.Balance))|| 0,
        sequence: accountData.Sequence,           // 트랜잭션 순서
        ownerCount: accountData.OwnerCount,      // 계정이 소유한 항목 수
        flags: accountData.Flags,                // 계정 설정 플래그
        updatedAt: new Date().toISOString(),
      };

      // 저장된 계정 정보 병합 및 갱신
      const stored = this.accounts.get(validAddress);
      const updated = stored ? { ...stored, ...accountInfo } : accountInfo;
      this.accounts.set(validAddress, updated);

      logger.info(`계정 정보 조회 완료: ${validAddress}`);
      return {
        success: true,
        account: updated,
      };
    } catch (error) {
      const isNotFound = error.message?.includes("actNotFound");
      const errorType = isNotFound ? "ACCOUNT_NOT_FOUND" : "QUERY_ERROR";
      const message = isNotFound ? "존재하지 않는 계정입니다" : error.message;

      logger[isNotFound ? "warn" : "error"](`계정 정보 조회 실패 (${address}):`, error);

      return {
        success: false,
        message,
        account: null,
        errorType,
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
      const balanceXRP = parseFloat(await xrplClient.getXrpBalance(validAddress)) || 0;
      const balance = parseFloat(XRPLClient.xrpToDrops(balanceXRP))|| 0;
      logger.error(`balanceXRP (${address}):`, parseFloat(await xrplClient.getXrpBalance(validAddress)));
      logger.error(`balance (${address}):`, parseFloat(XRPLClient.xrpToDrops(balanceXRP))|| 0);

      return {
        success: true,
        data: {
          address: validAddress,
          balance,
          balanceXRP
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

      if (!txRequest.secret) throw new Error("시드값은 필수입니다");
      if (!txRequest.amount || txRequest.amount <= 0) {
        throw new Error("유효한 송금액이 필요합니다");
      }

      logger.info(`XRP 전송 시작: ${txRequest.amount} XRP (${validFromAddress} → ${validToAddress})`);

      const wallet = XRPLClient.walletFromSeed(txRequest.secret);

      // 트랜잭션 준비
      const prepared = await this.xrplClient.autofill({
        TransactionType: "Payment",
        Account: validFromAddress,
        Amount: XRPLClient.xrpToDrops(txRequest.amount),
        Destination: validToAddress,
        LastLedgerSequence: (await this.xrplClient.getLedgerIndex()) + 200,
      });

      // 서명 및 제출 (sign 생략 → wallet 넘김)
      const result = await this.xrplClient.submitAndWait(prepared, { wallet });

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`XRP 전송 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);

      // 계정 정보 업데이트
      await this.getAccountInfo(txRequest.toAddress);
      await this.getAccountInfo(txRequest.fromAddress);

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

      const { result } = await this.xrplClient.request({
        command: "account_tx",
        account: validAddress,
        limit,
      });

      const RIPPLE_EPOCH = 946684800;

      const transactions = result.transactions
        .filter(tx => tx.tx)
        .map(({ tx, meta }) => {
          const isSuccess = meta?.TransactionResult === "tesSUCCESS";
          const rippleTimestamp = tx.date || Math.floor(Date.now() / 1000);
          const unixTimestamp = (rippleTimestamp + RIPPLE_EPOCH) * 1000;

          return {
            hash: tx.hash || "",
            amount: typeof tx.Amount === "string"
              ? parseFloat(XRPLClient.dropsToXrp(tx.Amount))
              : 0,
            fromAddress: tx.Account || "",
            toAddress: tx.Destination || "",
            timestamp: new Date(unixTimestamp).toISOString(),
            status: isSuccess ? "success" : "failed",
            txType: tx.TransactionType,
            fee: parseFloat(XRPLClient.dropsToXrp(tx.Fee || "0")),
          };
        });

      logger.info(`트랜잭션 내역 조회 성공: ${validAddress} (${transactions.length}건)`);

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
   * @param {string} address - XRPL 계정 주소
   * @returns {Object|null} 저장된 계정 정보
   */
  getStoredAccount(address) {
    const account = this.accounts.get(address) || null;
    logger.debug(`저장된 계정 조회: ${address} → ${account ? "존재함" : "없음"}`);
    return account;
  }

  /**
   * 모든 저장된 계정 목록 조회
   * @returns {Array<Object>} 저장된 계정 목록
   */
  getAllStoredAccounts() {
    const allAccounts = Array.from(this.accounts.values());
    logger.debug(`전체 저장된 계정 수: ${allAccounts.length}`);
    return allAccounts;
  }

  /**
   * 계정 정보 삭제
   * @param {string} address - 삭제할 XRPL 계정 주소
   * @returns {boolean} 삭제 성공 여부
   */
  deleteAccount(address) {
    const deleted = this.accounts.delete(address);
    logger[deleted ? "info" : "warn"](`계정 삭제 ${deleted ? "완료" : "실패"}: ${address}`);
    return deleted;
  }
}

module.exports = { AccountService, accountService: new AccountService() };
