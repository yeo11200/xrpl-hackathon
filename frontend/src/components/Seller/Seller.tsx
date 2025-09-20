import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Seller.css";
import { useTransactionDetail } from "../../hooks/useTransactionDetail";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  status: string;
  date: string;
}

const Seller = () => {
  const { openTransactionDetail } = useTransactionDetail();
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };
  const products: Product[] = [
    {
      id: 1,
      name: "VIP 콘서트 티켓",
      price: 150000,
      quantity: 50,
      status: "판매중",
      date: "2024-03-15",
    },
    {
      id: 2,
      name: "고급 세미나 입장권",
      price: 80000,
      quantity: 30,
      status: "판매중",
      date: "2024-03-14",
    },
    {
      id: 3,
      name: "프리미엄 워크샵",
      price: 200000,
      quantity: 20,
      status: "매진",
      date: "2024-03-13",
    },
    {
      id: 4,
      name: "스포츠 경기 티켓",
      price: 100000,
      quantity: 100,
      status: "판매중",
      date: "2024-03-12",
    },
  ];

  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  return (
    <div className="seller-container">
      <motion.div
        className="seller-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>판매자 센터</h1>
        <motion.button
          className="new-product-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          + 새 상품 등록
        </motion.button>
      </motion.div>

      <motion.div
        className="seller-table-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <table className="seller-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>가격</th>
              <th>수량</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() =>
                  openTransactionDetail(
                    "F1C84318D299E7DA7F3A7A0D4A7599D12D3FE3A5EFCB4F8AFAD5B3973A5B0BF4"
                  )
                }
                className="clickable-row"
              >
                <td>{product.name}</td>
                <td>{formatPrice(product.price)}</td>
                <td>{product.quantity}</td>
                <td>
                  <span
                    className={`status-badge ${
                      product.status === "매진" ? "sold-out" : "on-sale"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td>{product.date}</td>
                <td>
                  <div className="action-buttons">
                    <motion.button
                      className="refund-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast("환불 요청이 접수되었습니다.");
                      }}
                    >
                      환불
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Seller;
