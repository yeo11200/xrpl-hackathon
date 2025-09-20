import fetchApi from "../utils/fetch-api";

/**
 * 암호화폐 시세 관련 서비스
 */

// API Endpoints
const ENDPOINTS = {
  XRP_DETAIL:
    "https://api.coingecko.com/api/v3/coins/ripple?localization=false&tickers=false&market_data=true&community_data=false",
  SIMPLE_PRICE: "https://api.coingecko.com/api/v3/simple/price",
} as const;

// 캐시 데이터 타입
interface CacheData<T> {
  timestamp: number;
  data: T;
}

const CACHE_DURATION = 1000 * 60; // 1분 캐시
const priceCache: {
  detail: CacheData<XrpPriceInfo> | null;
  simple: CacheData<number> | null;
} = {
  detail: null,
  simple: null,
};

// API Response Types
export interface CoinGeckoDetailResponse {
  market_data: {
    current_price: {
      krw: number;
    };
    price_change_percentage_24h: number;
    last_updated: string;
    high_24h: {
      krw: number;
    };
    low_24h: {
      krw: number;
    };
  };
}

interface CoinGeckoSimplePriceResponse {
  ripple: {
    krw: number;
  };
}

// XRP 시세 정보 타입
export interface XrpPriceInfo {
  currentPrice: number; // 현재 가격 (KRW)
  priceChangePercent: number; // 24시간 가격 변동률 (%)
  lastUpdated: string; // 마지막 업데이트 시간
  high24h: number; // 24시간 최고가
  low24h: number; // 24시간 최저가
}

/**
 * CoinGecko API를 통해 XRP 시세 정보를 가져옵니다.
 * @returns XRP 시세 정보
 */
export const getXrpPrice = async (): Promise<XrpPriceInfo> => {
  // 캐시가 있고 유효한 경우
  if (
    priceCache.detail &&
    Date.now() - priceCache.detail.timestamp < CACHE_DURATION
  ) {
    return priceCache.detail.data;
  }

  try {
    const data = await fetchApi<CoinGeckoDetailResponse>(
      ENDPOINTS.XRP_DETAIL,
      {},
      true
    );

    const priceInfo = {
      currentPrice: data.market_data.current_price.krw,
      priceChangePercent: data.market_data.price_change_percentage_24h,
      lastUpdated: data.market_data.last_updated,
      high24h: data.market_data.high_24h.krw,
      low24h: data.market_data.low_24h.krw,
    };

    // 새로운 데이터 캐싱
    priceCache.detail = {
      timestamp: Date.now(),
      data: priceInfo,
    };

    return priceInfo;
  } catch (error) {
    // rate limit 에러인 경우 캐시된 데이터 반환
    if (error?.status?.error_code === 429 && priceCache.detail) {
      return priceCache.detail.data;
    }
    throw error;
  }
};

/**
 * 간단히 XRP의 현재 KRW 가격만 가져옵니다.
 * @returns XRP 현재 가격 (KRW)
 */
export const getSimpleXrpPrice = async (): Promise<number> => {
  // 캐시가 있고 유효한 경우
  if (
    priceCache.simple &&
    Date.now() - priceCache.simple.timestamp < CACHE_DURATION
  ) {
    return priceCache.simple.data;
  }

  try {
    const data = await fetchApi<CoinGeckoSimplePriceResponse>(
      ENDPOINTS.SIMPLE_PRICE,
      {
        queryParams: {
          ids: "ripple",
          vs_currencies: "krw",
        },
      },
      true
    );

    const price = data.ripple.krw;

    // 새로운 데이터 캐싱
    priceCache.simple = {
      timestamp: Date.now(),
      data: price,
    };

    return price;
  } catch (error) {
    // rate limit 에러인 경우 캐시된 데이터 반환
    if (error?.status?.error_code === 429 && priceCache.simple) {
      return priceCache.simple.data;
    } else {
      return 4000;
    }
    throw error;
  }
};
