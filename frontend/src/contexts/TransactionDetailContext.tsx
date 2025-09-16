import React, { useState, useCallback } from "react";
import { getXrplClient } from "../utils/xrpl-client";
import type { Transaction } from "../types/transaction";
import TransactionDetail from "../components/TransactionDetail/TransactionDetail";
import { TransactionDetailContext } from "../types/transaction-detail";
import type { TransactionDetailContextType } from "../types/transaction-detail";

export const TransactionDetailProvider: React.FC<{
  children: React.ReactNode;
}> & { context?: TransactionDetailContextType } = ({ children }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [, setTransactionHash] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<Transaction | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTransactionDetails = async (
    hash: string
  ): Promise<{
    success: boolean;
    transaction?: Transaction;
    message?: string;
  }> => {
    try {
      const client = await getXrplClient();
      const response = await client.request({
        command: "tx",
        transaction: hash,
      });

      if (response.result) {
        const tx = response.result as unknown as Record<string, unknown>;
        const transaction: Transaction = {
          hash: String(tx.hash || ""),
          type: String(tx.TransactionType || "Unknown"),
          account: String(tx.Account || ""),
          destination: tx.Destination ? String(tx.Destination) : undefined,
          amount:
            typeof tx.Amount === "string" || typeof tx.Amount === "object"
              ? tx.Amount
              : "0",
          fee: String(tx.Fee || "0"),
          sequence: Number(tx.Sequence || 0),
          date: new Date(
            (Number(tx.date || 0) + 946684800) * 1000
          ).toISOString(), // Ripple epoch to Unix epoch
          ledgerIndex: Number(tx.ledger_index || 0),
          validated: Boolean(tx.validated),
          meta:
            typeof tx.meta === "object" && tx.meta !== null
              ? (tx.meta as Record<string, unknown>)
              : undefined,
          status:
            (tx.meta as Record<string, unknown>)?.TransactionResult ===
            "tesSUCCESS"
              ? "success"
              : "failed",
        };

        return { success: true, transaction };
      } else {
        return {
          success: false,
          message: "트랜잭션을 찾을 수 없습니다.",
        };
      }
    } catch (err) {
      console.error("Transaction fetch error:", err);
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "트랜잭션 정보를 가져오는데 실패했습니다.",
      };
    }
  };

  const openTransactionDetail = useCallback(async (hash: string) => {
    setTransactionHash(hash);
    setIsPopupOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTransactionDetails(hash);

      if (result.success && result.transaction) {
        setTransactionData(result.transaction);
      } else {
        setError(result.message || "트랜잭션 정보를 가져오는데 실패했습니다.");
        setTransactionData(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
      setTransactionData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeTransactionDetail = useCallback(() => {
    setIsPopupOpen(false);
    setTransactionData(null);
    setTransactionHash(null);
    setError(null);
  }, []);

  return (
    <TransactionDetailContext.Provider
      value={{
        openTransactionDetail,
        closeTransactionDetail,
      }}
    >
      {children}
      <TransactionDetail
        isOpen={isPopupOpen}
        transaction={transactionData}
        isLoading={isLoading}
        error={error}
        onClose={closeTransactionDetail}
      />
    </TransactionDetailContext.Provider>
  );
};
