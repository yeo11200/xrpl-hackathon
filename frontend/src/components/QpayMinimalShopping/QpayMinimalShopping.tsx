import React from "react";
import "./QpayMinimalShopping.css";
import { useCryptoPrice } from "../../hooks/useCryptoPrice";

const QpayMinimalShopping = () => {
  const { convertXrpToKrw } = useCryptoPrice();
  // Products data
  const products = [
    {
      id: 1,
      name: "Premium Smartphone",
      originalPrice: 1200000,
      salePrice: 840000,
      discount: "30% OFF",
      description:
        "최신 기술이 집약된 프리미엄 스마트폰. 뛰어난 성능과 세련된 디자인이 조화를 이룹니다.",
      icon: "📱",
    },
    {
      id: 2,
      name: "Ultra-thin Laptop",
      originalPrice: convertXrpToKrw(30),
      salePrice: 1350000,
      discount: "25% OFF",
      description:
        "초경량 울트라씬 노트북. 어디서나 휴대 가능한 강력한 성능을 경험하세요.",
      icon: "💻",
    },
    {
      id: 3,
      name: "Wireless Headphones",
      originalPrice: 450000,
      salePrice: 270000,
      discount: "40% OFF",
      description:
        "프리미엄 노이즈 캔슬링 헤드폰. 완벽한 음질과 편안한 착용감을 제공합니다.",
      icon: "🎧",
    },
  ];

  // Categories data
  const categories = [
    { name: "Electronics", description: "최신 디지털 기기" },
    { name: "Fashion", description: "트렌디한 패션 아이템" },
    { name: "Home & Living", description: "라이프스타일 제품" },
    { name: "Beauty", description: "프리미엄 뷰티 제품" },
    { name: "Sports", description: "스포츠 & 아웃도어" },
    { name: "Books", description: "도서 & 문구류" },
  ];

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Format price function
  const formatPrice = (price) => {
    return `₩${price.toLocaleString()}`;
  };

  return (
    <div className="qpay-app">
      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-content">
          <div className="sale-badge">SPECIAL OFFER</div>
          <h1 className="hero-title">Xpay</h1>
          <p className="hero-description">
            프리미엄 제품을 합리적인 가격에.
            <br />
            큐레이션된 최고의 쇼핑 경험을 제공합니다.
          </p>
          <button
            className="cta-button"
            onClick={() => scrollToSection("products")}
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="section">
        <div className="container">
          <h2 className="section-title">FEATURED</h2>
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-item">
                <div className="product-image">
                  {product.icon}
                  <div className="discount-badge">{product.discount}</div>
                </div>
                <div className="product-content">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">
                    <span className="original-price">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="sale-price">
                      {formatPrice(product.salePrice)}
                    </span>
                  </div>
                  <p className="product-description">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="section section--alt">
        <div className="container">
          <h2 className="section-title">CATEGORIES</h2>
          <div className="category-grid">
            {categories.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-overlay"></div>
                <div className="category-content">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="about-title">ABOUT</h2>
              <p className="about-description">
                Xpay는 프리미엄 제품을 합리적인 가격에 제공하는 큐레이션 쇼핑
                플랫폼입니다.
              </p>
              <p className="about-description">
                엄선된 브랜드와 제품들로 고객에게 최고의 쇼핑 경험을 선사하며,
                품질과 가치를 동시에 추구합니다.
              </p>
              <button className="cta-button">Learn More</button>
            </div>
            <div className="about-visual">
              <div className="about-letter">Q</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">고객지원</h3>
              <ul className="footer-list">
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    주문/배송 조회
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    교환/반품
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    고객센터
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">회사정보</h3>
              <ul className="footer-list">
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    회사소개
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    채용정보
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    이용약관
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    개인정보처리방침
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">혜택/서비스</h3>
              <ul className="footer-list">
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    멤버십
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    쿠폰
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    적립금
                  </a>
                </li>
                <li className="footer-list-item">
                  <a href="#" className="footer-link">
                    이벤트
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">Xpay</h3>
              <p className="footer-brand">
                프리미엄 제품을 합리적인 가격에.
                <br />
                큐레이션된 최고의 쇼핑 경험을
                <br />
                제공합니다.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Qpay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QpayMinimalShopping;
