import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { motion } from "framer-motion";
import { verifyPayment } from "../../service/account.service";
import "./TicketVerifier.css";
import { useAuth } from "../../hooks/useAuth";

const TicketVerifier = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(
    null
  );
  const { xrplAccount } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerifyTicket = useCallback(async (scannedData: string) => {
    try {
      const qrData = JSON.parse(scannedData);
      const {
        buyerAddress = xrplAccount?.address || "",
        price,
        productId,
        productName,
      } = qrData;

      console.log("스캔된 QR 데이터:", qrData);

      const response = await verifyPayment(buyerAddress, {
        amount: Number(price),
        products_id: Number(productId),
      });

      alert(JSON.stringify(response));

      if (response.success) {
        setVerificationResult(
          `✅ 결제 검증 성공: ${productName}\n💰 금액: ${price} XRP\n🔗 TX: ${response.data.transactionHash}`
        );
      } else {
        throw new Error(response.data.message || "결제 검증 실패");
      }
    } catch (err) {
      console.error("검증 실패:", err);
      setError(err.message || "QR 코드 검증에 실패했습니다.");
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (!isProcessing) {
            console.log("QR Code Result:", result.data);
            setIsProcessing(true);
            handleVerifyTicket(result.data);
            setTimeout(() => {
              setIsProcessing(false);
            }, 10000);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          onDecodeError: (err) => {
            console.log("스캔 실패:", err); // 필요하면 켜고
          },
        }
      );

      qrScanner.start().catch((err) => {
        console.error("QR Scanner Error:", err);
        setError("QR 스캐너를 초기화하는 중 오류가 발생했습니다.");
      });

      return () => {
        qrScanner.stop();
      };
    }
  }, [handleVerifyTicket, isProcessing]);

  return (
    <div className="verifier-container">
      <motion.div
        className="verifier-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="title">QR 코드 티켓 검증</h1>
        <video ref={videoRef} className="scanner-video" muted playsInline />
        {verificationResult && (
          <motion.p
            className="result success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {verificationResult}
          </motion.p>
        )}
        {error && (
          <motion.p
            className="result error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default TicketVerifier;
