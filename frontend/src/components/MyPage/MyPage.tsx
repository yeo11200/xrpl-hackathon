import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import {
  type XRPLAccount,
  getXRPLAccountByAddress,
} from "../../service/account.service";
import "./MyPage.css";

const MyPage = () => {
  const { xrplAccount } = useAuth();
  const [accountData, setAccountData] = useState<XRPLAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  // 계정 정보 로드
  const loadAccountData = async () => {
    if (!xrplAccount?.address) {
      setError("계정 주소가 없습니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getXRPLAccountByAddress(xrplAccount.address);
      setAccountData(data);
    } catch (err) {
      console.error("계정 정보 로드 실패:", err);
      setError("계정 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrplAccount?.address]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString();
  };

  if (loading) {
    return (
      <div className="mypage-container">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  if (error || !accountData) {
    return (
      <div className="mypage-container">
        <div className="error-message">
          {error || "계정 정보를 불러올 수 없습니다."}
          <button onClick={loadAccountData} className="retry-btn">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <motion.div
        className="mypage-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="user-badge">
          <span className="user-icon">👤</span>
          <h1>{accountData.userId}님의 XRPL 계정</h1>
        </div>
        <div className="balance-display">
          <span className="balance-amount">
            {formatBalance(accountData.balanceXRP)} XRP
          </span>
          <span className="balance-drops">
            ({formatBalance(accountData.balance)} drops)
          </span>
          <button onClick={loadAccountData} className="refresh-btn">
            🔄 새로고침
          </button>
        </div>
      </motion.div>

      <motion.div
        className="account-details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="detail-section">
          <h2>계정 정보</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>주소</label>
              <div className="value-container">
                <span className="value address">{accountData.address}</span>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(accountData.address);
                    alert("주소가 복사되었습니다.");
                  }}
                >
                  복사
                </button>
              </div>
            </div>

            <div className="detail-item">
              <label>공개키</label>
              <div className="value-container">
                <span className="value">{accountData.publicKey}</span>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(accountData.publicKey);
                    alert("공개키가 복사되었습니다.");
                  }}
                >
                  복사
                </button>
              </div>
            </div>

            <div className="detail-item">
              <label>시퀀스 번호</label>
              <span className="value">{accountData.sequence}</span>
            </div>

            <div className="detail-item">
              <label>소유자 카운트</label>
              <span className="value">{accountData.ownerCount}</span>
            </div>

            <div className="detail-item">
              <label>계정 생성일</label>
              <span className="value">{formatDate(accountData.createdAt)}</span>
            </div>

            <div className="detail-item">
              <label>최근 업데이트</label>
              <span className="value">{formatDate(accountData.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="security-section">
          <h2>보안 정보</h2>
          <div className="security-warning">
            🔒 보안을 위해 시크릿 키와 개인키는 안전한 곳에 보관하세요
          </div>
          <div className="security-grid">
            <div className="security-item">
              <label>시크릿 키</label>
              <div className="value-container">
                <span className="value secret">
                  {showSecrets
                    ? accountData.secret
                    : `${accountData.secret.slice(
                        0,
                        8
                      )}...${accountData.secret.slice(-8)}`}
                </span>
                <button
                  className="reveal-btn"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? "숨기기" : "보기"}
                </button>
              </div>
            </div>

            <div className="security-item">
              <label>개인키</label>
              <div className="value-container">
                <span className="value secret">
                  {showSecrets
                    ? accountData.privateKey
                    : `${accountData.privateKey.slice(
                        0,
                        8
                      )}...${accountData.privateKey.slice(-8)}`}
                </span>
                <button
                  className="reveal-btn"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? "숨기기" : "보기"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="action-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button className="action-btn primary">거래 내역 보기</button>
          <button className="action-btn secondary">계정 설정</button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MyPage;
