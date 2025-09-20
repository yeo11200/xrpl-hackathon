import React, { useState } from 'react';
import './ProductDetail.css';

interface Product {
  id: number;
  name: string;
  originalPrice: number;
  salePrice: number;
  discount: string;
  rating: number;
  reviews: number;
  category: string;
  brand: string;
  image: string;
  icon: string;
  description: string;
  features: string[];
}

const ProductDetail: React.FC = () => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const product: Product = {
    id: 3,
    name: "Wireless Headphones",
    originalPrice: 450000,
    salePrice: 270000,
    discount: "40% OFF",
    rating: 4.8,
    reviews: 1247,
    category: "Audio",
    brand: "Qpay",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    icon: "🎧",
    description: "프리미엄 노이즈 캔슬링 헤드폰. 완벽한 음질과 편안한 착용감을 제공합니다.",
    features: [
      "액티브 노이즈 캔슬링",
      "30시간 배터리 수명",
      "고해상도 오디오 지원",
      "편안한 오버이어 디자인",
      "멀티포인트 연결",
      "빠른 충전 (15분 충전 3시간 재생)"
    ]
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const handleAddToCart = (): void => {
    setCartCount(cartCount + quantity);
  };

  const handleQuantityChange = (change: number): void => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.backgroundColor = '#333';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.backgroundColor = '#000';
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            Qpay
          </div>
          
          <nav className="nav">
            <a href="#" className="nav-link">Products</a>
            <a href="#" className="nav-link">About</a>
            <a href="#" className="nav-link">Contact</a>
            
            <div className="cart-badge">
              Cart {cartCount > 0 && `(${cartCount})`}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">→</span>
          <span>Audio</span>
          <span className="breadcrumb-separator">→</span>
          <span className="breadcrumb-current">Wireless Headphones</span>
        </div>

        {/* Product Section */}
        <div className="product-section">
          {/* Product Image */}
          <div className="product-image-container">
            <div className="product-image-wrapper">
              <img 
                src={product.image}
                alt={product.name}
                className="product-image"
              />
            </div>
            
            {/* Discount Badge */}
            <div className="discount-badge">
              {product.discount}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <div className="product-category">
                {product.category} • {product.brand}
              </div>
              
              <h1 className="product-title">
                {product.name}
              </h1>
              
              <div className="product-rating">
                <div className="rating-stars">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="price-section">
              <div className="price-container">
                <span className="sale-price">
                  ₩{formatPrice(product.salePrice)}
                </span>
                <span className="original-price">
                  ₩{formatPrice(product.originalPrice)}
                </span>
              </div>
              <p className="product-description">
                {product.description}
              </p>
            </div>

            {/* Features */}
            <div className="features-section">
              <h3 className="features-title">
                주요 특징
              </h3>
              <div className="features-list">
                {product.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-bullet"></div>
                    <span className="feature-text">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="cart-section">
              <div className="quantity-selector">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="quantity-btn quantity-btn-minus"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-display" aria-label={`Current quantity: ${quantity}`}>
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="quantity-btn quantity-btn-plus"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="add-to-cart-btn"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                aria-label="Add item to cart"
              >
                Add to Cart
              </button>
            </div>

            {/* Additional Info */}
            <div className="additional-info">
              <div className="info-item">
                <strong>무료 배송</strong> - 2-3일 내 배송
              </div>
              <div className="info-item">
                <strong>30일 무료 반품</strong> - 사용하지 않은 제품
              </div>
              <div className="info-item">
                <strong>1년 보증</strong> - 제조사 보증 포함
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            Qpay
          </div>
          
          <div className="footer-nav">
            <a href="#" className="footer-link">About</a>
            <a href="#" className="footer-link">Products</a>
            <a href="#" className="footer-link">Support</a>
            <a href="#" className="footer-link">Privacy</a>
          </div>
          
          <div className="footer-copyright">
            © 2024 Qpay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;