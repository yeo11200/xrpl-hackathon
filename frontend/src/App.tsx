import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { TransactionDetailProvider } from "./contexts/TransactionDetailContext";
import { TicketVerifierPage } from "./pages/TicketVerifierPage";
import { LoginPage } from "./pages/LoginPage";
import Header from "./components/Header";
import { PaymentsPage } from "./pages/PaymentsPage";
import { initXrplClient } from "./utils/xrpl-client";
import { SellerPage } from "./pages/SellerPage";
import { QpayMinimalShoppingPage } from "./pages/QpayMinimalShoppingPage";
import { MyPage } from "./pages/MyPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";


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

const Subscriptions = () => (
  <PageWrapper>
    <h1 className="text-2xl font-bold">📦 구독 관리</h1>
    <p className="mt-2 text-gray-600">내 구독 상품을 관리할 수 있습니다.</p>
  </PageWrapper>
);

// Profile 페이지를 MyPage로 대체

// 라우트 애니메이션 컨테이너
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<QpayMinimalShoppingPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/profile" element={<MyPage />} />
        <Route path="/ticket-verifier" element={<TicketVerifierPage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  useEffect(() => {
    initXrplClient();
  }, []);

  return (
    <AuthProvider>
      <TransactionDetailProvider>
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
      </TransactionDetailProvider>
    </AuthProvider>
  );
}

export default App;
