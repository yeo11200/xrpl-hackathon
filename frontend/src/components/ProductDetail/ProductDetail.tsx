import React, { useState } from "react";
import "./ProductDetail.css";

interface Product {
  id: number;
  name: string;
  originalPrice: number;
  salePrice: number;
  rating: number;
  reviews: number;
  category: string;
  brand: string;
  image: string;
  description: string;
  features: string[];
}

const Stars: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span aria-label={`평점 ${rating} / 5`} className="stars">
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"✩".repeat(Math.max(0, empty))}
    </span>
  );
};

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(
    price
  );

export default function ProductDetail() {
  const [quantity, setQuantity] = useState<number>(1);

  const product: Product = {
    id: 2,
    name: "Ultra-thin Laptop",
    originalPrice: 1800000,
    salePrice: 1350000,
    rating: 4.9,
    reviews: 892,
    category: "Electronics",
    brand: "Qpay",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&auto=format&fit=crop",
    description:
      "초경량 울트라씬 노트북. 어디서나 휴대 가능한 강력한 성능을 경험하세요.",
    features: [
      "14인치 고해상도 디스플레이",
      "최신형 칩셋",
      "16GB 메모리",
      "512GB SSD",
      "최대 18시간 배터리",
      "무게 1.4kg",
    ],
  };

  const discountPct = Math.round(
    (1 - product.salePrice / product.originalPrice) * 100
  );

  const handleQuantityChange = (change: number): void =>
    setQuantity((prev) => Math.max(1, prev + change));

  return (
    <div className="page">
      {" "}
      {/* Main */}
      <main className="container main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span>홈</span>
          <span className="crumb-gap">→</span>
          <span>Electronics</span>
          <span className="crumb-gap">→</span>
          <span className="current">Ultra-thin Laptop</span>
        </div>

        {/* Product Section */}
        <div className="grid">
          {/* Image */}
          <div className="img-wrap">
            <div className="img-frame">
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="img"
              />
            </div>
            <div className="badge">{discountPct}% OFF</div>
          </div>

          {/* Info */}
          <div>
            <div className="meta">
              <div className="meta-line">
                {product.category} • {product.brand}
              </div>
              <h1 className="title">{product.name}</h1>
              <div className="rating">
                <div className="rating-row">
                  <Stars rating={product.rating} />
                  <span className="rating-text">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <div className="price">
                <span className="price-now">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="price-old">
                  {formatPrice(product.originalPrice)}
                </span>
              </div>
              <p className="desc">{product.description}</p>
            </div>

            {/* Features */}
            <div className="features">
              <h3 className="features-title">주요 특징</h3>
              <div className="feature-list">
                {product.features.map((f, i) => (
                  <div key={i} className="feature-item">
                    <span className="dot" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="cta-row">
              <div className="qty">
                <button
                  type="button"
                  aria-label="수량 감소"
                  className="qty-btn"
                  onClick={() => handleQuantityChange(-1)}
                >
                  −
                </button>
                <span className="qty-val">{quantity}</span>
                <button
                  type="button"
                  aria-label="수량 증가"
                  className="qty-btn"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>
              <button type="button" className="add-btn" onClick={() => {}}>
                Add to Cart
              </button>
            </div>

            {/* Additional Info */}
            <div className="info">
              <div className="info-line">
                <strong>무료 배송</strong> - 2-3일 내 배송
              </div>
              <div className="info-line">
                <strong>30일 무료 반품</strong> - 사용하지 않은 제품
              </div>
              <div className="info-line">
                <strong>2년 보증</strong> - 제조사 보증 포함
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
