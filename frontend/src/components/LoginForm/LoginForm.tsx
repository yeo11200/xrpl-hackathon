import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";

const LoginForm: React.FC = () => {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 한글, 영어, 숫자만 입력 허용
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 한글, 영어, 숫자만 허용하는 정규식
    const regex = /^[가-힣a-zA-Z0-9]*$/;

    if (regex.test(value)) {
      setNickname(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsLoading(true);

    // 로딩 애니메이션을 위한 딜레이
    setTimeout(() => {
      login(nickname.trim());
      navigate("/");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="login-app">
      {/* Background Pattern */}
      <div className="login-background">
        <div className="pattern-overlay"></div>
      </div>

      {/* Login Container */}
      <div className="login-container">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="login-logo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            XPay
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            className="login-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1>Welcome Back</h1>
            <p>간단한 닉네임으로 시작하세요</p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            className="login-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="form-group">
              <label htmlFor="nickname" className="form-label">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="한글, 영어, 숫자만 입력 가능"
                className="form-input"
                disabled={isLoading}
                autoComplete="username"
                maxLength={20}
              />
            </div>

            <motion.button
              type="submit"
              className={`login-button ${isLoading ? "loading" : ""}`}
              disabled={!nickname.trim() || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                "로그인"
              )}
            </motion.button>
          </motion.form>

          {/* Features */}
          <motion.div
            className="login-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>빠른 시작</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>안전한 결제</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💎</span>
              <span>프리미엄 경험</span>
            </div>
          </motion.div>

          {/* Footer - 회원가입 버튼 제거 */}
          <motion.div
            className="login-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p>닉네임으로 간편하게 시작하세요</p>
          </motion.div>
        </motion.div>

        {/* Side Graphics */}
        <motion.div
          className="login-graphics"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="graphic-circle circle-1"></div>
          <div className="graphic-circle circle-2"></div>
          <div className="graphic-circle circle-3"></div>
          <div className="graphic-text">X</div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;
