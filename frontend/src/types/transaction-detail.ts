import { createContext } from "react";

export interface TransactionDetailContextType {
  openTransactionDetail: (hash: string) => void;
  closeTransactionDetail: () => void;
}

export const TransactionDetailContext = createContext<
  TransactionDetailContextType | undefined
>(undefined);
