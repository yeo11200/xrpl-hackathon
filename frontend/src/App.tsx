import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TicketVerifierPage } from "./pages/TicketVerifierPage";
import Header from "./components/Header";
import TicketQRCodePopup from "./components/TicketQRCodePopup";
import { initXrplClient } from "./utils/xrpl-client";
import { SellerPage } from "./pages/SellerPage";
import { QpayMinimalShoppingPage } from "./pages/QpayMinimalShoppingPage";


// 페이지 컴포넌트 예시
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);

  const dummyData = {
    sellerAddress: "rLQqxNFHqdQy5Pj5nXsqD54X4fJYh4PdH",
    buyerAddress: "rLQqxNFHqdQy5Pj5nXsqD54X4fJYh4PdH",
    price: "100",
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold">🏠 홈</h1>
      <p className="mt-2 text-gray-600">여기는 메인 페이지입니다.</p>
      <button onClick={() => setIsOpen(true)} style={{ padding: "12px 20px" }}>
        🎟️ 티켓 QR 보기
      </button>

      <TicketQRCodePopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        qrData={dummyData}
      />
    </PageWrapper>
  );
};

const Payments = () => (
  <PageWrapper>
    <h1 className="text-2xl font-bold">💳 결제내역</h1>
    <p className="mt-2 text-gray-600">최근 결제 기록을 확인하세요.</p>
  </PageWrapper>
);

const Subscriptions = () => (
  <PageWrapper>
    <h1 className="text-2xl font-bold">📦 구독 관리</h1>
    <p className="mt-2 text-gray-600">내 구독 상품을 관리할 수 있습니다.</p>
  </PageWrapper>
);

const Profile = () => (
  <PageWrapper>
    <h1 className="text-2xl font-bold">👤 마이페이지</h1>
    <p className="mt-2 text-gray-600">개인 정보를 확인하세요.</p>
  </PageWrapper>
);

// 라우트 애니메이션 컨테이너
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ticket-verifier" element={<TicketVerifierPage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/QpayMinimalShopping" element={<QpayMinimalShoppingPage/>} />
 
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  useEffect(() => {
    initXrplClient();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main>
          <section className="w-full md:w-3/4">
            <AnimatedRoutes />
          </section>
        </main>
      </div>
    </Router>
  );
}

export default App;
