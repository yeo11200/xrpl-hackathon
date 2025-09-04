const xrpl = require("xrpl");
const logger = require("../utils/logger");

class XRPLClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.serverUrl =
      process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233";
    this.network = process.env.XRPL_NETWORK || "testnet";
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info("XRPL client already connected");
        return this.client;
      }

      logger.info(`Connecting to XRPL server: ${this.serverUrl}`);
      this.client = new xrpl.Client(this.serverUrl);
      await this.client.connect();
      this.isConnected = true;

      logger.info("✅ Successfully connected to XRPL");
      return this.client;
    } catch (error) {
      logger.error("Failed to connect to XRPL:", error);
      throw new Error(`XRPL connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        this.client = null;
        logger.info("Disconnected from XRPL");
      }
    } catch (error) {
      logger.error("Error disconnecting from XRPL:", error);
    }
  }

  async getClient() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.client;
  }

  async getAccountInfo(address) {
    try {
      const client = await this.getClient();
      const response = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });

      logger.info(`Account info retrieved for ${address}`);
      return response.result.account_data;
    } catch (error) {
      logger.error(`Failed to get account info for ${address}:`, error);
      throw error;
    }
  }

  async getAccountBalance(address) {
    try {
      const client = await this.getClient();
      const response = await client.getXrpBalance(address);

      logger.info(`Balance retrieved for ${address}: ${response} XRP`);
      return response;
    } catch (error) {
      logger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  async createWallet() {
    try {
      const client = await this.getClient();
      const wallet = xrpl.Wallet.generate();

      logger.info(`New wallet created: ${wallet.address}`);
      return {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      logger.error("Failed to create wallet:", error);
      throw error;
    }
  }

  async fundWallet(address, amount = "1000") {
    try {
      const client = await this.getClient();

      // Only fund on testnet
      if (this.network === "testnet") {
        const fundResponse = await client.fundWallet();
        logger.info(`Wallet funded: ${address}`);
        return fundResponse;
      } else {
        logger.warn("Wallet funding only available on testnet");
        return { message: "Funding only available on testnet" };
      }
    } catch (error) {
      logger.error(`Failed to fund wallet ${address}:`, error);
      throw error;
    }
  }

  async sendPayment(fromWallet, toAddress, amount) {
    try {
      const client = await this.getClient();

      const prepared = await client.autofill({
        TransactionType: "Payment",
        Account: fromWallet.address,
        Amount: xrpl.xrpToDrops(amount),
        Destination: toAddress,
      });

      const signed = fromWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      logger.info(
        `Payment sent: ${amount} XRP from ${fromWallet.address} to ${toAddress}`
      );
      return {
        hash: result.result.hash,
        validated: result.result.validated,
        meta: result.result.meta,
      };
    } catch (error) {
      logger.error("Payment failed:", error);
      throw error;
    }
  }

  async getTransaction(hash) {
    try {
      const client = await this.getClient();
      const response = await client.request({
        command: "tx",
        transaction: hash,
      });

      logger.info(`Transaction retrieved: ${hash}`);
      return response.result;
    } catch (error) {
      logger.error(`Failed to get transaction ${hash}:`, error);
      throw error;
    }
  }

  async getServerInfo() {
    try {
      const client = await this.getClient();
      const response = await client.request({
        command: "server_info",
      });

      return response.result.info;
    } catch (error) {
      logger.error("Failed to get server info:", error);
      throw error;
    }
  }

  /**
   * XRPL 클라이언트 인스턴스를 가져오는 함수
   * @returns {Promise<Client>} XRPL 클라이언트 인스턴스
   */
  async getXrplClient() {
    if (this.client && this.client.isConnected()) {
      return this.client;
    }

    try {
      const client = new xrpl.Client(this.serverUrl);
      await client.connect();
      this.client = client;
      this.isConnected = true;

      logger.info("XRPL 클라이언트 연결 성공");
      return client;
    } catch (error) {
      logger.error("XRPL 클라이언트 연결 실패:", error);
      throw new Error("XRPL 네트워크에 연결할 수 없습니다.");
    }
  }

  /**
   * 클라이언트 연결을 해제하는 함수
   */
  async disconnectXrplClient() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      logger.info("XRPL 클라이언트 연결 해제");
    }
  }

  /**
   * 계정 정보 조회
   * @param {string} address 계정 주소
   * @returns {Promise<Object>} 계정 정보
   */
  async getAccountInfo(address) {
    try {
      const client = await this.getXrplClient();

      const response = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });

      logger.info(`계정 정보 조회 성공: ${address}`);
      return {
        success: true,
        account: {
          address: address,
          balance: response.result.account_data.Balance,
          sequence: response.result.account_data.Sequence,
        },
      };
    } catch (error) {
      logger.error(`계정 정보 조회 실패 (${address}):`, error);
      return {
        success: false,
        message: error.message,
        account: null,
      };
    }
  }

  /**
   * XRP 전송
   * @param {Object} txRequest 트랜잭션 요청
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async sendPayment(txRequest) {
    try {
      const client = await this.getXrplClient();
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
   * @param {string} address 계정 주소
   * @returns {Promise<Object>} 트랜잭션 내역
   */
  async getTransactionHistory(address) {
    try {
      const client = await this.getXrplClient();

      const response = await client.request({
        command: "account_tx",
        account: address,
        limit: 20,
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
   * 지갑 생성 (테스트넷에서 자동 펀딩)
   * @returns {Promise<Object>} 새 지갑 정보
   */
  async createAndFundWallet() {
    try {
      const client = await this.getXrplClient();
      const wallet = await xrpl.Wallet.generate();

      // 테스트넷에서 자동 펀딩
      const result = await client.fundWallet(wallet);

      logger.info(`새 지갑 생성 및 펀딩 완료: ${wallet.address}`);
      return {
        success: true,
        account: {
          address: wallet.address,
          secret: wallet.seed,
          balance: result.balance.toString(),
        },
      };
    } catch (error) {
      logger.error("지갑 생성 실패:", error);
      return {
        success: false,
        message: error.message,
        account: null,
      };
    }
  }
}

// Singleton instance
const xrplClient = new XRPLClient();

module.exports = xrplClient;
