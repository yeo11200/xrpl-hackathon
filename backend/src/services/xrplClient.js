const xrpl = require("xrpl");
const logger = require("../utils/logger");

class XRPLClient {
  constructor(serverUrl, network) {
    this.client = null;
    this.isConnected = false;
    this.serverUrl = serverUrl || process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233";
    this.network = network || process.env.XRPL_NETWORK || "testnet";
  }

  // 연결 관리
  // 명시적 연결 메서드 (기존과 호환성 유지)
  async connect() {
    if (this.isConnected) {
      logger.info("XRPL 클라이언트가 이미 연결되어 있습니다");
      return this.client;
    } try {
      logger.info(`XRPL 서버에 연결 중: ${this.serverUrl}`);
      this.client = new xrpl.Client(this.serverUrl);
      await this.client.connect();
      this.isConnected = true;

      logger.info("✅ XRPL 클라이언트 연결 성공");
      return this.client;
    } catch (error) {
      logger.error("XRPL 클라이언트 연결 실패:", error);
      throw new Error(`XRPL 네트워크에 연결할 수 없습니다: ${error.message}`);
    }
  }

  // 연결 해제
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        this.client = null;
        logger.info("XRPL 클라이언트 연결 해제");
      }
    } catch (error) {
      logger.error("XRPL 연결 해제 중 오류:", error);
    }
  }

  // 클라이언트 가져오기 (자동 연결 포함)
  async getClient() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.client;
  }

  // 기본 XRPL API
  async request(command) {
    try {
      const client = await this.getClient();
      return await client.request(command);
    } catch (error) {
      logger.error("XRPL 요청 실패:", error);
      throw error;
    }
  }

  async submitAndWait(txBlob, options = undefined) {
    try {
      const client = await this.getClient();
      // options 예: { wallet }
      return await client.submitAndWait(txBlob, options);
    } catch (error) {
      logger.error("트랜잭션 전송 실패:", error);
      throw error;
    }
  }

  async fundWallet(wallet = null) {
    if (this.network !== "testnet") {
      throw new Error("펀딩은 테스트넷에서만 가능합니다");
    }
    try {
      const client = await this.getClient();
      return await client.fundWallet(wallet, { faucetHost: null });
    } catch (error) {
      logger.error("지갑 펀딩 실패:", error);
      throw error;
    }
  }

  async getXrpBalance(address) {
    try {
      const client = await this.getClient();
      const response = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated"
      });

    const drops = response.result.account_data.Balance;
    return xrpl.dropsToXrp(drops); // XRP 단위로 변환
    } catch (error) {
      logger.error(`잔액 조회 실패 (${address}):`, error);
      throw error;
    }
  }

  async autofill(transaction) {
    try {
      const client = await this.getClient();
      return await client.autofill(transaction);
    } catch (error) {
      logger.error("트랜잭션 autofill 실패:", error);
      throw error;
    }
  }

  async getLedgerIndex() {
    try {
      const response = await this.request({ command: "ledger_current" });
      return response.result.ledger_current_index;
    } catch (error) {
      logger.error("Ledger 인덱스 조회 실패:", error);
      throw error;
    }
  }

  // Static 유틸리티
  static isValidAddress(address) {
    try {
      return xrpl.isValidClassicAddress(address);
    } catch {
      return false;
    }
  }

  static xrpToDrops(xrp) {
    return xrpl.xrpToDrops(xrp);
  }

  static dropsToXrp(drops) {
    return xrpl.dropsToXrp(drops);
  }

  static generateWallet() {
    return xrpl.Wallet.generate();
  }

  static walletFromSeed(seed) {
    return xrpl.Wallet.fromSeed(seed);
  }
}

// 하이브리드 export
const xrplClient = new XRPLClient();

module.exports = {
  xrplClient,     // 싱글톤 인스턴스
  XRPLClient      // 클래스 자체
};