import React, { createContext, useState, useEffect } from "react";
import { getSimpleXrpPrice } from "../service/crypto-price.service";

// Context에서 제공할 타입 정의
interface CryptoPriceContextType {
  xrpPrice: number | null;
  loading: boolean;
  error: string | null;
  refreshPrice: () => Promise<void>;
  convertXrpToKrw: (xrpAmount: number) => string;
}

// XRP를 KRW로 변환하는 함수
const convertXrpToKrwImpl = (
  xrpAmount: number,
  currentPrice: number | null
): string => {
  if (!currentPrice) {
    return "계산 중...";
  }

  const krwValue = xrpAmount * currentPrice;

  if (krwValue >= 1000000000000) {
    const trillions = krwValue / 1000000000000;
    return `${trillions.toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
    })}조원`;
  } else if (krwValue >= 100000000) {
    const billions = krwValue / 100000000;
    return `${billions.toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
    })}억원`;
  } else if (krwValue >= 10000) {
    const tenThousands = krwValue / 10000;
    return `${tenThousands.toLocaleString("ko-KR", {
      maximumFractionDigits: 0,
    })}만원`;
  } else {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(krwValue);
  }
};

// Context 생성
const CryptoPriceContext = createContext<CryptoPriceContextType | undefined>(
  undefined
);

// Provider 컴포넌트
export const CryptoPriceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [xrpPrice, setXrpPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // XRP 시세 정보 가져오기
  const fetchXrpPrice = async () => {
    try {
      setLoading(true);
      const price = await getSimpleXrpPrice();
      setXrpPrice(price);
      setError(null);
    } catch (err) {
      setError("시세 정보를 불러오는데 실패했습니다.");
      console.error("XRP 시세 조회 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시와 주기적으로 가격 정보 업데이트
  useEffect(() => {
    fetchXrpPrice();

    // 1분마다 가격 정보 업데이트
    const intervalId = setInterval(fetchXrpPrice, 60000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(intervalId);
  }, []);

  // 외부에서 수동으로 가격 정보를 갱신할 수 있는 함수
  const refreshPrice = async () => {
    if (!loading) {
      // 이미 로딩 중이면 중복 요청 방지
      await fetchXrpPrice();
    }
  };

  // XRP -> KRW 변환 함수
  const convertXrpToKrw = (xrpAmount: number): string => {
    return convertXrpToKrwImpl(xrpAmount, xrpPrice);
  };

  // Context 값 정의
  const value = {
    xrpPrice,
    loading,
    error,
    refreshPrice,
    convertXrpToKrw,
  };

  return (
    <CryptoPriceContext.Provider value={value}>
      {children}
    </CryptoPriceContext.Provider>
  );
};

// Context를 외부에서 사용할 수 있도록 export
export { CryptoPriceContext };
