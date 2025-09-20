import { useContext } from "react";
import { CryptoPriceContext } from "../contexts/CryptoPriceContext";

export const useCryptoPrice = () => {
  const context = useContext(CryptoPriceContext);
  if (context === undefined) {
    throw new Error(
      "useCryptoPrice는 CryptoPriceProvider 내부에서 사용해야 합니다."
    );
  }
  return context;
};
