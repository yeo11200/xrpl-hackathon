import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useTransactionDetail } from "../../hooks/useTransactionDetail";
import "./PaymentHistory.css";

interface PaymentTransaction {
  id: string;
  hash: string;
  type: "purchase" | "refund" | "transfer";
  productName?: string;
  amount: number;
  currency: "XRP" | "USD";
  status: "completed" | "pending" | "failed";
  date: string;
  counterparty: string;
  description: string;
}

const PaymentHistory = () => {
  const { nickname } = useAuth();
  const { openTransactionDetail } = useTransactionDetail();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [filter, setFilter] = useState<
    "all" | "purchase" | "refund" | "transfer"
  >("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - 실제로는 API에서 가져올 데이터
  const mockTransactions: PaymentTransaction[] = [
    {
      id: "1",
      hash: "E3FE6EA3D48F0C2B63448B8C05F8D5F8B1C85F9A2D8C6B3E4F7A1B2C3D4E5F6G",
      type: "purchase",
      productName: "VIP 콘서트 티켓",
      amount: 120000,
      currency: "XRP",
      status: "completed",
      date: "2024-03-15T10:30:00Z",
      counterparty: "rSELLER123...XYZ",
      description: "프리미엄 콘서트 티켓 구매",
    },
    {
      id: "2",
      hash: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2",
      type: "transfer",
      amount: 50000,
      currency: "XRP",
      status: "completed",
      date: "2024-03-14T15:45:00Z",
      counterparty: "rFRIEND456...ABC",
      description: "친구에게 송금",
    },
    {
      id: "3",
      hash: "Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4J3I2H1G0F9E8D7C6B5A4Z3Y2X1W0V9U8",
      type: "purchase",
      productName: "온라인 세미나 입장권",
      amount: 60000,
      currency: "XRP",
      status: "completed",
      date: "2024-03-13T09:15:00Z",
      counterparty: "rEDUCATOR789...DEF",
      description: "비즈니스 세미나 참가권",
    },
    {
      id: "4",
      hash: "M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6",
      type: "refund",
      productName: "워크샵 참가권",
      amount: 25000,
      currency: "XRP",
      status: "completed",
      date: "2024-03-12T14:20:00Z",
      counterparty: "rWORKSHOP234...GHI",
      description: "워크샵 취소로 인한 환불",
    },
  ];

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    const timer = setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "XRP") {
      return `${(amount / 1000000).toFixed(2)} XRP`;
    }
    return `₩${amount.toLocaleString()}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return "🛍️";
      case "refund":
        return "💸";
      case "transfer":
        return "💰";
      default:
        return "💳";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return "구매";
      case "refund":
        return "환불";
      case "transfer":
        return "송금";
      default:
        return "기타";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#27ae60";
      case "pending":
        return "#f39c12";
      case "failed":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className="payment-history-app">
      {/* Hero Section */}
      <motion.section
        className="payment-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <motion.div
            className="welcome-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            PAYMENT HISTORY
          </motion.div>
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            결제 내역
          </motion.h1>
          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {nickname ? `${nickname}님의 ` : ""}모든 거래 내역을 한눈에
            확인하세요
          </motion.p>
        </div>
      </motion.section>

      <div className="container">
        {/* Filter Tabs */}
        <motion.section
          className="filter-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="filter-tabs">
            {[
              { key: "all", label: "전체" },
              { key: "purchase", label: "구매" },
              { key: "transfer", label: "송금" },
              { key: "refund", label: "환불" },
            ].map((tab, index) => (
              <motion.button
                key={tab.key}
                className={`filter-tab ${filter === tab.key ? "active" : ""}`}
                onClick={() => setFilter(tab.key as any)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Transaction List */}
        <motion.section
          className="transactions-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {isLoading ? (
            <div className="loading-container">
              <motion.div
                className="loading-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p>거래 내역을 불러오는 중...</p>
            </div>
          ) : (
            <div className="transactions-grid">
              <AnimatePresence>
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="transaction-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => openTransactionDetail(transaction.hash)}
                  >
                    <div className="transaction-header">
                      <div className="transaction-type">
                        <span className="type-icon">
                          {getTypeIcon(transaction.type)}
                        </span>
                        <span className="type-label">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                      <div
                        className="transaction-status"
                        style={{ color: getStatusColor(transaction.status) }}
                      >
                        ●
                      </div>
                    </div>

                    <div className="transaction-content">
                      <h3 className="transaction-title">
                        {transaction.productName || transaction.description}
                      </h3>
                      <p className="transaction-amount">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </p>
                      <p className="transaction-date">
                        {formatDate(transaction.date)}
                      </p>
                      <p className="transaction-hash">
                        {truncateHash(transaction.hash)}
                      </p>
                    </div>

                    <div className="transaction-footer">
                      <span className="counterparty">
                        {transaction.counterparty.slice(0, 12)}...
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTransactions.length === 0 && !isLoading && (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="empty-icon">📭</div>
                  <h3>거래 내역이 없습니다</h3>
                  <p>
                    아직 {filter === "all" ? "" : getTypeLabel(filter)} 거래가
                    없습니다.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default PaymentHistory;
