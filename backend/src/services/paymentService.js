const xrpl = require("xrpl");
const { v4: uuidv4 } = require("uuid");
const xrplClient = require("./xrplClient");
const logger = require("../utils/logger");

class PaymentService {
  constructor() {
    this.payments = new Map(); // In-memory storage for demo purposes
  }

  async createPaymentRequest(amount, description, merchantAddress) {
    try {
      const paymentId = uuidv4();
      const timestamp = new Date().toISOString();

      const paymentRequest = {
        id: paymentId,
        amount: parseFloat(amount),
        description,
        merchantAddress,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };

      this.payments.set(paymentId, paymentRequest);

      logger.info(`Payment request created: ${paymentId} for ${amount} XRP`);
      return paymentRequest;
    } catch (error) {
      logger.error("Failed to create payment request:", error);
      throw error;
    }
  }

  async processPayment(paymentId, customerWalletSeed, customerAddress) {
    try {
      const paymentRequest = this.payments.get(paymentId);

      if (!paymentRequest) {
        throw new Error("Payment request not found");
      }

      if (paymentRequest.status !== "pending") {
        throw new Error("Payment request is not pending");
      }

      if (new Date() > new Date(paymentRequest.expiresAt)) {
        paymentRequest.status = "expired";
        this.payments.set(paymentId, paymentRequest);
        throw new Error("Payment request has expired");
      }

      // Create customer wallet from seed
      const customerWallet = xrpl.Wallet.fromSeed(customerWalletSeed);

      // Verify wallet address matches
      if (customerWallet.address !== customerAddress) {
        throw new Error("Wallet address does not match seed");
      }

      // Check balance
      const balance = await xrplClient.getAccountBalance(customerAddress);
      if (balance < paymentRequest.amount) {
        throw new Error("Insufficient balance");
      }

      // Send payment
      const paymentResult = await xrplClient.sendPayment(
        customerWallet,
        paymentRequest.merchantAddress,
        paymentRequest.amount.toString()
      );

      // Update payment status
      paymentRequest.status = "completed";
      paymentRequest.transactionHash = paymentResult.hash;
      paymentRequest.customerAddress = customerAddress;
      paymentRequest.completedAt = new Date().toISOString();
      paymentRequest.updatedAt = new Date().toISOString();

      this.payments.set(paymentId, paymentRequest);

      logger.info(`Payment completed: ${paymentId}, tx: ${paymentResult.hash}`);

      return {
        paymentId,
        status: "completed",
        transactionHash: paymentResult.hash,
        amount: paymentRequest.amount,
        merchantAddress: paymentRequest.merchantAddress,
        customerAddress,
      };
    } catch (error) {
      logger.error(`Payment processing failed for ${paymentId}:`, error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const payment = this.payments.get(paymentId);

      if (!payment) {
        throw new Error("Payment not found");
      }

      // If payment is completed, get transaction details
      if (payment.status === "completed" && payment.transactionHash) {
        try {
          const transaction = await xrplClient.getTransaction(
            payment.transactionHash
          );
          return {
            ...payment,
            transactionDetails: transaction,
          };
        } catch (error) {
          logger.warn(
            `Could not fetch transaction details for ${payment.transactionHash}:`,
            error
          );
        }
      }

      return payment;
    } catch (error) {
      logger.error(`Failed to get payment status for ${paymentId}:`, error);
      throw error;
    }
  }

  async refundPayment(paymentId, merchantWalletSeed) {
    try {
      const payment = this.payments.get(paymentId);

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.status !== "completed") {
        throw new Error("Payment is not completed");
      }

      // Create merchant wallet from seed
      const merchantWallet = xrpl.Wallet.fromSeed(merchantWalletSeed);

      // Verify merchant address matches
      if (merchantWallet.address !== payment.merchantAddress) {
        throw new Error("Merchant wallet address does not match");
      }

      // Send refund
      const refundResult = await xrplClient.sendPayment(
        merchantWallet,
        payment.customerAddress,
        payment.amount.toString()
      );

      // Update payment status
      payment.status = "refunded";
      payment.refundHash = refundResult.hash;
      payment.refundedAt = new Date().toISOString();
      payment.updatedAt = new Date().toISOString();

      this.payments.set(paymentId, payment);

      logger.info(`Payment refunded: ${paymentId}, tx: ${refundResult.hash}`);

      return {
        paymentId,
        status: "refunded",
        refundHash: refundResult.hash,
        amount: payment.amount,
        customerAddress: payment.customerAddress,
      };
    } catch (error) {
      logger.error(`Refund failed for ${paymentId}:`, error);
      throw error;
    }
  }

  async getPaymentHistory(address, type = "all") {
    try {
      const payments = Array.from(this.payments.values());

      let filteredPayments;
      switch (type) {
        case "sent":
          filteredPayments = payments.filter(
            (p) => p.customerAddress === address && p.status === "completed"
          );
          break;
        case "received":
          filteredPayments = payments.filter(
            (p) => p.merchantAddress === address && p.status === "completed"
          );
          break;
        case "pending":
          filteredPayments = payments.filter(
            (p) =>
              (p.customerAddress === address ||
                p.merchantAddress === address) &&
              p.status === "pending"
          );
          break;
        default:
          filteredPayments = payments.filter(
            (p) =>
              p.customerAddress === address || p.merchantAddress === address
          );
      }

      return filteredPayments.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    } catch (error) {
      logger.error(`Failed to get payment history for ${address}:`, error);
      throw error;
    }
  }

  async validateAddress(address) {
    try {
      return xrpl.isValidClassicAddress(address);
    } catch (error) {
      return false;
    }
  }

  async validateSeed(seed) {
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

// Singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;
