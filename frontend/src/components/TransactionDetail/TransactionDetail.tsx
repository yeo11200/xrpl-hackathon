import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transaction } from "../../types/transaction";
import "./TransactionDetail.css";

interface TransactionDetailProps {
  isOpen: boolean;
  transaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({
  isOpen,
  transaction,
  isLoading,
  error,
  onClose,
}) => {
  const formatAmount = (amount: string | object) => {
    if (typeof amount === "string") {
      // XRP amount in drops
      return `${(parseInt(amount) / 1_000_000).toFixed(6)} XRP`;
    } else if (typeof amount === "object" && amount !== null) {
      // Token amount
      const tokenAmount = amount as { value: string; currency: string };
      return `${tokenAmount.value} ${tokenAmount.currency}`;
    }
    return "N/A";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      Payment: "결제",
      OfferCreate: "오더 생성",
      OfferCancel: "오더 취소",
      TrustSet: "신뢰선 설정",
      AccountSet: "계정 설정",
      EscrowCreate: "에스크로 생성",
      EscrowFinish: "에스크로 완료",
      EscrowCancel: "에스크로 취소",
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#27ae60";
      case "failed":
        return "#e74c3c";
      case "pending":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return "성공";
      case "failed":
        return "실패";
      case "pending":
        return "대기중";
      default:
        return "알 수 없음";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="transaction-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="transaction-modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="transaction-modal-header">
              <h2>트랜잭션 상세 정보</h2>
              <button className="modal-close-btn" onClick={onClose}>
                ✖
              </button>
            </div>

            {/* Content */}
            <div className="transaction-modal-body">
              {isLoading && (
                <div className="loading-section">
                  <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p>트랜잭션 정보를 불러오는 중...</p>
                </div>
              )}

              {error && (
                <motion.div
                  className="error-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="error-icon">⚠️</div>
                  <h3>오류 발생</h3>
                  <p>{error}</p>
                </motion.div>
              )}

              {transaction && !isLoading && !error && (
                <motion.div
                  className="transaction-details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Status Badge */}
                  <div className="status-section">
                    <div
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(transaction.status),
                      }}
                    >
                      <span className="status-icon">
                        {transaction.status === "success"
                          ? "✓"
                          : transaction.status === "failed"
                          ? "✗"
                          : "⏳"}
                      </span>
                      {getStatusLabel(transaction.status)}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="info-section">
                    <h3>기본 정보</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>트랜잭션 해시</label>
                        <span className="hash-value">{transaction.hash}</span>
                      </div>
                      <div className="info-item">
                        <label>타입</label>
                        <span>{getTransactionTypeLabel(transaction.type)}</span>
                      </div>
                      <div className="info-item">
                        <label>일시</label>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      <div className="info-item">
                        <label>레저 인덱스</label>
                        <span>{transaction.ledgerIndex.toLocaleString()}</span>
                      </div>
                      <div className="info-item">
                        <label>시퀀스</label>
                        <span>{transaction.sequence}</span>
                      </div>
                      <div className="info-item">
                        <label>수수료</label>
                        <span>{formatAmount(transaction.fee)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="info-section">
                    <h3>계정 정보</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>발신자</label>
                        <span className="address-value">
                          {transaction.account}
                        </span>
                      </div>
                      {transaction.destination && (
                        <div className="info-item">
                          <label>수신자</label>
                          <span className="address-value">
                            {transaction.destination}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount Info */}
                  {transaction.amount && (
                    <div className="info-section">
                      <h3>금액 정보</h3>
                      <div className="amount-display">
                        <span className="amount-value">
                          {formatAmount(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  {transaction.meta && (
                    <div className="info-section">
                      <h3>메타 정보</h3>
                      <div className="meta-info">
                        <div className="info-item">
                          <label>트랜잭션 결과</label>
                          <span
                            style={{
                              color:
                                transaction.meta?.TransactionResult ===
                                "tesSUCCESS"
                                  ? "#27ae60"
                                  : "#e74c3c",
                            }}
                          >
                            {String(
                              transaction.meta?.TransactionResult || "Unknown"
                            )}
                          </span>
                        </div>
                        {transaction.meta?.delivered_amount && (
                          <div className="info-item">
                            <label>전달된 금액</label>
                            <span>
                              {formatAmount(transaction.meta.delivered_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="action-section">
                    <motion.button
                      className="action-btn secondary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigator.clipboard.writeText(transaction.hash);
                        // TODO: Show toast notification
                      }}
                    >
                      해시 복사
                    </motion.button>
                    <motion.button
                      className="action-btn primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        window.open(
                          `https://testnet.xrpl.org/transactions/${transaction.hash}`,
                          "_blank"
                        );
                      }}
                    >
                      XRPL 익스플로러에서 보기
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionDetail;
