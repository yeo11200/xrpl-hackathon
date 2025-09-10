import { useEffect, useState } from "react";
import { subscribeToAccount } from "../utils/xrpl-client";

export const useXrplSocket = (address: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [txEvent, setTxEvent] = useState<unknown>(null);

  useEffect(() => {
    if (!address) return;

    subscribeToAccount(address, (event) => {
      console.log("📩 XRPL Event:", event);

      // 결제 트랜잭션일 때
      if (event.transaction.TransactionType === "Payment") {
        setTxEvent({
          hash: event.transaction.hash,
          amount: event.transaction.Amount,
        });

        // XRP 잔액 다시 조회
        if (event.transaction.Account === address) {
          setBalance(
            (prev) => prev - Number(event.transaction.Amount) / 1_000_000
          );
        }
      }
    });
  }, [address]);

  return { balance, txEvent };
};
