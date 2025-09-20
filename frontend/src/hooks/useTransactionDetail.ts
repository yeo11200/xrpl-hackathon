import { useContext } from "react";
import { TransactionDetailContext } from "../types/transaction-detail";

export const useTransactionDetail = () => {
  const context = useContext(TransactionDetailContext);
  if (!context) {
    throw new Error(
      "useTransactionDetail must be used within a TransactionDetailProvider"
    );
  }
  return context;
};
