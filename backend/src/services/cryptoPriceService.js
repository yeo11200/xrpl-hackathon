// crypto-price.service.js (Node.js용)
// Node 18+는 글로벌 fetch 제공. 그 이하 버전은 node-fetch를 동적 import로 사용
const fetch =
  globalThis.fetch ||
  ((...args) => import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args)));
const logger = require("../utils/logger");
/**
 * 암호화폐 시세 관련 서비스
 */
class CryptoPriceService {
  /**
   * CoinGecko API를 통해 XRP 시세 정보를 가져옵니다.
   * @returns {Promise<Object>} XRP 시세 정보
   */
  async getXrpPrice() {
    try {
      logger.info("XRP 시세 정보 요청 중...");
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/ripple?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false"
      );

      if (!response.ok) {
        throw new Error("XRP 시세 정보를 가져오는데 실패했습니다.");
      }

      const data = await response.json();

      const priceInfo = {
        currentPrice: data.market_data.current_price.krw,
        priceChangePercent: data.market_data.price_change_percentage_24h,
        lastUpdated: data.market_data.last_updated,
        high24h: data.market_data.high_24h.krw,
        low24h: data.market_data.low_24h.krw,
      };

      logger.info(`XRP 현재 가격: ${priceInfo.currentPrice} KRW`);
      return priceInfo;
    } catch (error) {
      console.error("XRP 시세 조회 오류:", error);
      throw error;
    }
  }
  /**
   * 간단히 XRP의 현재 KRW 가격만 가져옵니다.
   * @returns {Promise<number>} XRP 현재 가격 (KRW)
   */
  async getSimpleXrpPrice() {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=krw"
      );

      if (!response.ok) {
        throw new Error("XRP 시세 정보를 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      const price = data.ripple.krw;

      logger.info(`XRP 간단 가격 조회: ${price} KRW`);
      return price;
    } catch (error) {
      console.error("XRP 시세 조회 오류:", error);
      throw error;
    }
  }
}

// 싱글톤 패턴으로 내보내기
module.exports = new CryptoPriceService();
