import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./TicketQRCodePopup.css";

interface QRData {
  buyerAddress: string;
  price: string;
  productId: string;
  productName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  qrData: QRData;
}

const TicketQRCodePopup: React.FC<Props> = ({ isOpen, onClose, qrData }) => {
  if (!isOpen) return null;

  const qrValue = JSON.stringify(qrData);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <h2 className="popup-title">내 티켓 QR 코드</h2>

        <div className="qr-container">
          <QRCodeCanvas
            value={qrValue}
            size={200}
            level="H"
            className="qr-code"
          />
        </div>

        <div className="ticket-info">
          <h3 className="info-section-title">거래 정보</h3>

          <div className="info-row">
            <span className="info-label">상품 이름</span>
            <span className="info-value">{qrData.productName}</span>
          </div>

          <div className="info-row">
            <span className="info-label">구매자 주소</span>
            <span className="info-value address">{qrData.buyerAddress}</span>
          </div>

          <div className="info-row">
            <span className="info-label">가격</span>
            <span className="info-value price">{qrData.price} XRP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketQRCodePopup;
