import React, { useState, useEffect } from "react";
import "./ProductDetail.css";

// 제품 타입 정의
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  description: string;
  images: string[];
  status: "inStock" | "outOfStock" | "comingSoon";
  stockCount?: number;
  releaseDate?: string;
}

// 상태별 더미데이터 생성 함수
const generateDummyData = (
  status: "inStock" | "outOfStock" | "comingSoon"
): Product => {
  const baseProducts = {
    inStock: {
      id: "product-in-stock",
      name: "Premium Wireless Headphones",
      category: "Audio",
      price: 199000,
      originalPrice: 299000,
      rating: 4.8,
      reviews: 2847,
      description:
        "고급 무선 헤드폰으로 뛰어난 음질과 편안한 착용감을 제공합니다.",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",
      ],
      status: "inStock" as const,
      stockCount: 127,
    },
    outOfStock: {
      id: "product-out-stock",
      name: "Ultra Gaming Laptop Pro",
      category: "Computing",
      price: 2899000,
      originalPrice: 3299000,
      rating: 4.9,
      reviews: 1523,
      description:
        "최고 성능의 게이밍 노트북으로 모든 게임을 최고 설정에서 플레이할 수 있습니다.",
      images: [
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600",
        "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600",
      ],
      status: "outOfStock" as const,
      stockCount: 0,
    },
    comingSoon: {
      id: "product-coming-soon",
      name: "Next-Gen Smartphone X1",
      category: "Mobile",
      price: 1599000,
      originalPrice: 1599000,
      rating: 0,
      reviews: 0,
      description:
        "차세대 스마트폰으로 혁신적인 기능들을 탑재한 미래형 디바이스입니다.",
      images: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600",
      ],
      status: "comingSoon" as const,
      releaseDate: "2025-03-15",
    },
  };

  return baseProducts[status];
};

// Props 타입
interface ProductDetailProps {
  status?: "inStock" | "outOfStock" | "comingSoon";
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  status = "inStock",
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // 상태에 따른 더미데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      // API 호출 시뮬레이션 (1초 지연)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const dummyProduct = generateDummyData(status);
      setProduct(dummyProduct);
      setLoading(false);
    };

    loadProduct();
  }, [status]);

  // 유틸리티 함수
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product?.status === "inStock") {
      alert(`${product.name} ${quantity}개가 장바구니에 추가되었습니다!`);
    }
  };

  const getStatusBadge = () => {
    if (!product) return null;

    switch (product.status) {
      case "inStock":
        return <span className="badge badge--in-stock">재고 있음</span>;
      case "outOfStock":
        return <span className="badge badge--out-stock">품절</span>;
      case "comingSoon":
        return <span className="badge badge--coming-soon">출시 예정</span>;
      default:
        return null;
    }
  };

  const getActionButton = () => {
    if (!product) return null;

    switch (product.status) {
      case "inStock":
        return (
          <button className="btn btn--primary" onClick={handleAddToCart}>
            장바구니 담기 - ₩{formatPrice(product.price * quantity)}
          </button>
        );
      case "outOfStock":
        return (
          <button className="btn btn--disabled" disabled>
            품절 - 재입고 알림 신청
          </button>
        );
      case "comingSoon":
        return (
          <button className="btn btn--secondary">
            출시 알림 받기 ({product.releaseDate})
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="error">
          <h2>상품을 찾을 수 없습니다</h2>
          <p>요청하신 상품 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Product Detail */}
      <div className="product-layout">
        {/* Image Section */}
        <div className="image-section">
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="main-image"
          />
          <div className="thumbnails">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${
                  selectedImage === index ? "thumbnail--active" : ""
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="thumbnail-img"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          {/* Status & Category */}
          <div className="status-header">
            <span className="category">{product.category}</span>
            {getStatusBadge()}
          </div>

          <h1 className="product-title">{product.name}</h1>

          {/* Rating (재고 있는 제품만) */}
          {product.status === "inStock" && (
            <div className="rating">
              <span className="stars">★★★★★</span>
              <span className="rating-number">{product.rating}</span>
              <span className="reviews">
                ({product.reviews.toLocaleString()}개 리뷰)
              </span>
            </div>
          )}

          <p className="description">{product.description}</p>

          {/* Pricing */}
          <div className="pricing">
            {product.originalPrice > product.price && (
              <div className="price-original">
                ₩{formatPrice(product.originalPrice)}
              </div>
            )}
            <div className="price-current">₩{formatPrice(product.price)}</div>
          </div>

          {/* Quantity (재고 있는 제품만) */}
          {product.status === "inStock" && (
            <div className="quantity-section">
              <h3 className="quantity-title">수량</h3>
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
              {product.stockCount && (
                <p className="stock-info">재고: {product.stockCount}개 남음</p>
              )}
              {getActionButton()}
            </div>
          )}

          {/* Action Button (품절/출시예정) */}
          {product.status !== "inStock" && (
            <div className="action-section">
              {getActionButton()}
              {product.status === "comingSoon" && (
                <p className="release-date">출시일: {product.releaseDate}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
