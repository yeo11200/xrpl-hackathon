import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Seller.css";

type Transaction = {
  id: string;
  productName: string;
  buyerAddress: string;
  amount: number;
  status: "pending" | "paid" | "refunded";
};

const Seller = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      productName: "VIP 콘서트 티켓",
      buyerAddress: "rABC123...XYZ",
      amount: 100,
      status: "paid",
    },
    {
      id: "2",
      productName: "굿즈 패키지",
      buyerAddress: "rDEF456...XYZ",
      amount: 50,
      status: "pending",
    },
    {
      id: "3",
      productName: "온라인 강의권",
      buyerAddress: "rGHI789...XYZ",
      amount: 20,
      status: "refunded",
    },
  ]);

  const [toastOpen, setToastOpen] = useState(false);

  const handleRefund = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, status: "refunded" } : tx))
    );
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  return (
    <div className="seller-page">
      <motion.h1
        className="seller-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        판매자 거래 내역
      </motion.h1>

      <motion.div
        className="table-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <table className="seller-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>구매자 주소</th>
              <th>금액</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <td>{tx.productName}</td>
                <td className="buyer">{tx.buyerAddress}</td>
                <td>{tx.amount} XRP</td>
                <td>
                  <span className={`status ${tx.status}`}>
                    {tx.status === "pending" && "대기중"}
                    {tx.status === "paid" && "결제완료"}
                    {tx.status === "refunded" && "환불완료"}
                  </span>
                </td>
                <td>
                  {tx.status === "paid" && (
                    <button
                      className="refund-btn"
                      onClick={() => handleRefund(tx.id)}
                    >
                      환불하기
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {toastOpen && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
          >
            ✅ 환불이 완료되었습니다.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Seller;
