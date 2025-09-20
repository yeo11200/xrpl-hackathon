import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ProductDetail.css";
import { getProductById, type Product } from "../../service/shop.service";
import { useCryptoPrice } from "../../hooks/useCryptoPrice";
import { useAuth } from "../../hooks/useAuth";
import TicketQRCodePopup from "../TicketQRCodePopup";

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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState<number>(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showQRPopup, setShowQRPopup] = useState<boolean>(false);
  const { convertXrpToKrw } = useCryptoPrice();
  const { xrplAccount } = useAuth();

  // 상품 정보 조회
  const loadProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getProductById(parseInt(id));

      console.log(response);
      setProduct(response.product);
    } catch (err) {
      console.error("상품 정보 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // id가 변경될 때마다 상품 정보 다시 로드
  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <main className="container main">
          <div className="loading">상품 정보를 불러오는 중...</div>
        </main>
      </div>
    );
  }

  const handleQuantityChange = (change: number): void =>
    setQuantity((prev) => Math.max(1, prev + change));

  return (
    <div className="page">
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
          </div>

          {/* Info */}
          <div>
            <div className="meta">
              <div className="meta-line">{product.category}</div>
              <h1 className="title">{product.name}</h1>
              <div className="rating">
                <div className="rating-row">
                  <Stars rating={5} />
                  <span className="rating-text">{5} (3000 reviews)</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <div className="price">
                <span className="price-xrp">{product.price} XRP</span>
                <span className="price-krw">
                  약 {convertXrpToKrw(product.price)}
                </span>
              </div>
              <p className="desc">{product.description}</p>
            </div>

            {/* Features */}
            <div>
              <div className="features">
                <h3 className="features-title">주요 특징</h3>
                <div className="feature-list">
                  {product.description.map((f, i) => (
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
                <button
                  type="button"
                  className="buy-now-btn"
                  onClick={() => {
                    setShowQRPopup(true);
                  }}
                >
                  즉시 구매
                </button>

                {/* QR Code Popup */}
                {showQRPopup && product && (
                  <TicketQRCodePopup
                    isOpen={showQRPopup}
                    onClose={() => setShowQRPopup(false)}
                    qrData={{
                      buyerAddress: xrplAccount.address,
                      price: product.price.toString(),
                      productId: product.id.toString(),
                      productName: product.name,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
