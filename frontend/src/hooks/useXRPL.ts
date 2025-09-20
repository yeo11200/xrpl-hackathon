import { useEffect, useState } from "react";
import { subscribeToAccount } from "../utils/xrpl-client";

interface XRPLTransaction {
  hash: string;
  TransactionType: string;
  Account: string;
  Amount: string | { value: string; currency: string };
}

interface XRPLEvent {
  transaction: XRPLTransaction;
}

export const useXrplSocket = (address: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [txEvent, setTxEvent] = useState<{
    hash: string;
    amount: string | { value: string; currency: string };
  } | null>(null);

  useEffect(() => {
    if (!address) return;

    subscribeToAccount(address, (event: unknown) => {
      const xrplEvent = event as XRPLEvent;
      console.log("📩 XRPL Event:", xrplEvent);

      // 결제 트랜잭션일 때
      if (xrplEvent.transaction.TransactionType === "Payment") {
        setTxEvent({
          hash: xrplEvent.transaction.hash,
          amount: xrplEvent.transaction.Amount,
        });

        // XRP 잔액 다시 조회
        if (xrplEvent.transaction.Account === address) {
          const amount =
            typeof xrplEvent.transaction.Amount === "string"
              ? Number(xrplEvent.transaction.Amount)
              : Number(xrplEvent.transaction.Amount.value);
          setBalance((prev) => prev - amount / 1_000_000);
        }
      }
    });
  }, [address]);

  return { balance, txEvent };
};
