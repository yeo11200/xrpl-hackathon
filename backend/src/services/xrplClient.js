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
}

// Singleton instance
const xrplClient = new XRPLClient();

module.exports = xrplClient;
