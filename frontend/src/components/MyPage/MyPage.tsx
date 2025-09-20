import React from "react";
import { motion } from "framer-motion";
import "./MyPage.css";

interface XRPLAccount {
  address: string;
  secret: string;
  publicKey: string;
  privateKey: string;
  balance: number;
  balanceXRP: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sequence: number;
  ownerCount: number;
  flags: number;
}

const MyPage = () => {
  // 더미 데이터
  const accountData: XRPLAccount = {
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb",
    publicKey:
      "ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A",
    privateKey:
      "EDB4C4E046826BD26190D09715FC31F4E6A728204EADD112905B08B14B7F15C4",
    balance: 1000000000,
    balanceXRP: 1000,
    userId: "satoshi",
    createdAt: "2024-03-15T09:00:00Z",
    updatedAt: "2024-03-15T09:30:00Z",
    sequence: 1337,
    ownerCount: 5,
    flags: 0,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString();
  };

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
                  onClick={() =>
                    navigator.clipboard.writeText(accountData.address)
                  }
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
                  onClick={() =>
                    navigator.clipboard.writeText(accountData.publicKey)
                  }
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
                  {accountData.secret.slice(0, 8)}...
                  {accountData.secret.slice(-8)}
                </span>
                <button className="reveal-btn">보기</button>
              </div>
            </div>

            <div className="security-item">
              <label>개인키</label>
              <div className="value-container">
                <span className="value secret">
                  {accountData.privateKey.slice(0, 8)}...
                  {accountData.privateKey.slice(-8)}
                </span>
                <button className="reveal-btn">보기</button>
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
