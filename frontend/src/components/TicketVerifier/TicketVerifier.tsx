import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import fetchApi from "../../utils/fetch-api";
import localStorageUtil from "../../utils/local-storage";
import { motion } from "framer-motion";
import "./TicketVerifier.css";

export type VerificationResponse = {
  status: string;
  data: {
    event_name: string;
    ticket_id: number;
    status: string;
  };
};

const TicketVerifier = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(
    null
  );
  const [eventSymbol] = useState<string>(
    localStorageUtil.get("eventsymbol") || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerifyTicket = useCallback(
    async (scannedData: string) => {
      try {
        const { userId, ticketId } = JSON.parse(scannedData);

        console.log({
          user_id: userId,
          event_symbol: eventSymbol,
          ticket_id: ticketId,
        });

        const response = await fetchApi<VerificationResponse>(
          "/ticket/verify",
          {
            method: "POST",
            body: {
              user_id: userId,
              event_symbol: eventSymbol,
              ticket_id: `${ticketId}`,
            },
          }
        );
        setVerificationResult(
          `✅ 티켓 검증 성공: ${response.data.event_name}, 상태: ${response.data.status}`
        );
      } catch (err) {
        setError(err.message || "티켓 검증에 실패했습니다.");
      }
    },
    [eventSymbol]
  );

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
