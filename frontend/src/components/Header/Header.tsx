import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Header.css"; // CSS 따로 작성

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "홈", path: "/" },
    { name: "결제내역", path: "/payments" },
    { name: "구독", path: "/subscriptions" },
    { name: "마이페이지", path: "/profile" },
  ];

  return (
    <header className="header">
      <div className="header-container">
        {/* 로고 */}
        <Link to="/" className="logo">
          🚀 XPay
        </Link>

        {/* PC 메뉴 */}
        <nav className="menu-pc">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `menu-link ${isActive ? "active" : ""}`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* 모바일 버튼 */}
        <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            className="menu-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `menu-link ${isActive ? "active" : ""}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
