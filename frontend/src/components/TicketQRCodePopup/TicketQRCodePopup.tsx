import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import "./TicketQRCodePopup.css";
import { useXrplSocket } from "../../hooks/useXRPL";
import Toast from "../Toast";

type TicketQRCodePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  qrData: {
    sellerAddress: string;
    buyerAddress: string;
    price: string;
  };
};

const TicketQRCodePopup: React.FC<TicketQRCodePopupProps> = ({
  isOpen,
  onClose,
  qrData,
}) => {
  const { txEvent } = useXrplSocket(qrData.buyerAddress);

  const qrValue = JSON.stringify(qrData);

  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (txEvent) {
      onClose();
      setToastOpen(true); // ✅ 결제 성공 시 알림 토스트 오픈
    }
  }, [txEvent, onClose]);

  useEffect(() => {
    window.setTimeout(() => {
      setToastOpen(true);
    }, 2000);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="popup-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="popup-title">내 티켓 QR 코드</h2>
            <QRCodeCanvas value={qrValue} size={200} includeMargin />
            <div className="popup-info">
              <div className="info-section">
                <h3>거래 정보</h3>
                <p>
                  <strong>판매자 주소:</strong>
                </p>
                <p className="address-text">{qrData.sellerAddress}</p>
                <p>
                  <strong>구매자 주소:</strong>
                </p>
                <p className="address-text">{qrData.buyerAddress}</p>
                <p>
                  <strong>가격:</strong>
                </p>
                <p className="address-text">{qrData.price} XRP</p>
              </div>
            </div>

            <button className="close-btn" onClick={onClose}>
              닫기 ✖
            </button>
            {toastOpen && (
              <Toast
                message="결제가 성공적으로 완료되었습니다."
                isOpen={toastOpen}
                onClose={() => setToastOpen(false)}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TicketQRCodePopup;
