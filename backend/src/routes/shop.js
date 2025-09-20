const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

// 예시 상품 데이터
const products = [
  {
    id: 1,
    name: "iPhone 17 Pro",
    description: [
      "6.3인치 Super Retina XDR 디스플레이",
      "A19 Pro 칩셋",
      "트리플 카메라 시스템",
      "티타늄 소재 디자인",
    ],
    price: 0.447,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-model-unselect-gallery-2-202509?wid=5120&hei=2880&fmt=webp&qlt=90&.v=dU9qRExIQUlQTzVKeDd1V1dtUE1MUWFRQXQ2R0JQTk5udUZxTkR3ZVlpTEVqWElVVkRpc1V5YU5kb3VzUVZndzBoUVhuTWlrY2hIK090ZGZZbk9HeEJWb1BiTjRORlc1Y1lKU3JWempySktQVFcxaWdDV1ZRTjhLQ2h5TEk5bUxmbW94YnYxc1YvNXZ4emJGL0IxNFp3",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "iPhone 17",
    description: [
      "6.1인치 Super Retina XDR 디스플레이",
      "A19 칩셋",
      "듀얼 카메라 시스템",
      "경량 알루미늄 프레임",
    ],
    price: 0.322,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0SGxMd2pTV2lzd1JWWVByckE3ZkZ2T2d2S3NaRzcrU0dmYjNHTUFiMnlsWFUxSlgrVWMrMzU1OXo2c2JyNjJZTGlVWUdBNW8yNGVMT200dXdIeFVYVFU",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "iPhone 17 Pro Max",
    description: [
      "6.9인치 Super Retina XDR 디스플레이",
      "A19 Pro 칩셋",
      "최대 5배 망원 줌 카메라",
      "대용량 배터리",
    ],
    price: 0.497,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-9inch?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0RU9WT2libVhHSFU1bzRZekIyYTl6VWd2S3NaRzcrU0dmYjNHTUFiMnlsWFUxSlgrVWMrMzU1OXo2c2JyNjJZTGlnU1lRd2Fub0FrT1h0QkhlNEh1OFY",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
];

/**
 * @api {get} /api/shop/products 01. 상품 목록 조회
 */
router.get("/products", (req, res) => {
  try {
    res.json({
      success: true,
      products: products,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: products.length,
        hasNext: false,
        hasPrev: false,
      },
      categories: ["iPhone"],
    });
  } catch (error) {
    logger.error("상품 목록 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "상품 목록을 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @api {get} /api/shop/products/:id 02. 상품 상세 조회
 */
router.get("/products/:id", (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      product: product,
    });
  } catch (error) {
    logger.error("상품 상세 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "상품 정보를 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
