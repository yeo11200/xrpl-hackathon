// Header.tsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import CategoryDropdown from "./CategoryDropdown";
import "./Header.css";

interface MenuItem {
  name: string;
  path: string;
}

interface Category {
  name: string;
  korName: string;
  subTitle: string;
  path: string;
  color: string;
}

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, nickname, logout } = useAuth();

  const menuItems: MenuItem[] = [
    { name: "홈", path: "/" },
    { name: "주문/배송조회", path: "/payments" },
    { name: "티켓검증", path: "/ticket-verifier" }
  ];

  const categories: Category[] = [
    {
      name: "Electronics",
      korName: "전자제품",
      subTitle: "최신 디지털 기기",
      path: "/category/electronics",
      color: "from-purple-500 to-blue-500"
    },
    {
      name: "Fashion",
      korName: "패션",
      subTitle: "트렌디한 패션 아이템",
      path: "/category/fashion",
      color: "from-purple-500 to-blue-500"
    },
    {
      name: "Home & Living",
      korName: "홈&리빙",
      subTitle: "라이프스타일 제품",
      path: "/category/home-living",
      color: "from-purple-500 to-blue-500"
    },
    {
      name: "Beauty",
      korName: "뷰티",
      subTitle: "프리미엄 뷰티 제품",
      path: "/category/beauty",
      color: "from-purple-500 to-blue-500"
    },
    {
      name: "Sports",
      korName: "스포츠",
      subTitle: "스포츠 & 아웃도어",
      path: "/category/sports",
      color: "from-purple-500 to-blue-500"
    },
    {
      name: "Books",
      korName: "도서",
      subTitle: "도서 & 문구류",
      path: "/category/books",
      color: "from-purple-500 to-blue-500"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  const handleAuthClick = (): void => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate("/login");
    }
  };

  return (
    <motion.header
      className={`header ${isScrolled ? "header--scrolled" : ""}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="header-container">
        <Link to="/" className="logo" onClick={scrollToTop}>
          XPay
        </Link>

        <nav className="menu-pc">
          <NavLink
            to="/"
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
          >
            홈
          </NavLink>

          <div
            className="category-dropdown"
            onMouseEnter={() => setIsCategoryOpen(true)}
            onMouseLeave={() => setIsCategoryOpen(false)}
          >
            <span className="menu-link category-trigger">
              카테고리
              <motion.span
                className="category-arrow"
                animate={{ rotate: isCategoryOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </span>

            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CategoryDropdown />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {menuItems.slice(1).map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <motion.button className="nav-button">🔍</motion.button>
          <motion.button className="nav-button">❤️</motion.button>
          <motion.button className="nav-button">🛒</motion.button>
          <motion.button className="nav-button primary" onClick={handleAuthClick}>
            {isAuthenticated ? `${nickname} 님` : "로그인"}
          </motion.button>
          {isAuthenticated && (
            <motion.button className="nav-button" onClick={() => navigate("/profile")}>마이페이지</motion.button>
          )}
          {isAuthenticated && <motion.button className="nav-button">쿠폰</motion.button>}
        </div>

        <motion.button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
          <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}>
            {isOpen ? "✖" : "☰"}
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            className="menu-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ul>
              {menuItems.map((item, index) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
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
    </motion.header>
  );
};

export default Header;
