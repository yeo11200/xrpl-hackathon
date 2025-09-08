const express = require("express");
const router = express.Router();
const paymentService = require("../services/paymentService");
const accountService = require("../services/accountService");
const cryptoPriceService = require("../services/cryptoPriceService");
const logger = require("../utils/logger");

// 예시 상품 데이터 (실제로는 데이터베이스에서 관리)
// 상품 객체 구조:
// - id: 상품 고유 식별자 (number)
// - name: 상품명 (string)
// - description: 상품 설명 (string)
// - price: 상품 가격 - KRW 단위 (number)
// - image: 상품 이미지 URL (string)
// - category: 상품 카테고리 (string: "NFT", "Apparel", "Accessories")
// - stock: 재고 수량 (number)
// - createdAt: 상품 생성일시 (ISO string)
const products = [
  {
    id: 1,
    name: "XRPL NFT #001",
    description: "특별한 XRPL 기반 NFT 아트워크",
    price: 15000, // KRW
    image:
      "https://via.placeholder.com/300x300/1E3A8A/FFFFFF?text=XRPL+NFT+001",
    category: "NFT",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "XRPL T-Shirt",
    description: "XRPL 로고가 새겨진 프리미엄 면 티셔츠",
    price: 7500, // KRW
    image:
      "https://via.placeholder.com/300x300/059669/FFFFFF?text=XRPL+T-Shirt",
    category: "Apparel",
    stock: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "XRPL Mug",
    description: "XRPL 브랜드 머그컵 - 아침 커피와 함께",
    price: 4500, // KRW
    image: "https://via.placeholder.com/300x300/7C3AED/FFFFFF?text=XRPL+Mug",
    category: "Accessories",
    stock: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "XRPL Sticker Pack",
    description: "다양한 XRPL 스티커 세트",
    price: 1500, // KRW
    image:
      "https://via.placeholder.com/300x300/DC2626/FFFFFF?text=Sticker+Pack",
    category: "Accessories",
    stock: 200,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "XRPL Hoodie",
    description: "따뜻한 XRPL 후드티",
    price: 22500, // KRW
    image: "https://via.placeholder.com/300x300/1F2937/FFFFFF?text=XRPL+Hoodie",
    category: "Apparel",
    stock: 25,
    createdAt: new Date().toISOString(),
  },
];

// 장바구니 데이터 구조 (실제로는 세션이나 데이터베이스에서 관리)
// Map<sessionId, CartObject>
// CartObject 구조:
// - items: Array<CartItem> - 장바구니 상품들
//   - productId: number - 상품 ID
//   - name: string - 상품명
//   - price: number - 상품 가격 (KRW)
//   - quantity: number - 수량
//   - image: string - 상품 이미지 URL
// - createdAt: string - 장바구니 생성일시
// - updatedAt: string - 장바구니 수정일시
const carts = new Map();

// 주문 데이터 구조 (실제로는 데이터베이스에서 관리)
// Map<orderId, OrderObject>
// OrderObject 구조:
// - id: string - 주문 ID
// - customerAddress: string - 고객 XRPL 주소
// - customerName: string - 고객명
// - customerEmail: string - 고객 이메일
// - items: Array<CartItem> - 주문 상품들
// - totalAmountKRW: number - 주문 총액 (KRW)
// - totalAmountXRP: number - 결제 총액 (XRP)
// - xrpPrice: number - 주문 시점 XRP 가격
// - xrpPriceInfo: Object - XRP 상세 시세 정보
// - status: string - 주문 상태 ("pending", "paid", "cancelled")
// - paymentHash: string - 결제 트랜잭션 해시 (결제 완료 시)
// - paymentId: string - 결제 요청 ID (결제 완료 시)
// - paidAmountXRP: number - 실제 결제된 XRP 금액
// - createdAt: string - 주문 생성일시
// - updatedAt: string - 주문 수정일시
// - paidAt: string - 결제 완료일시
const orders = new Map();

/**
 * @route GET /api/shop/products
 * @desc 상품 목록 조회
 * @access Public
 */
router.get("/products", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let filteredProducts = [...products];

    // 카테고리 필터링
    if (category && category !== "all") {
      filteredProducts = filteredProducts.filter(
        (p) => p.category === category
      );
    }

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // XRP 가격 정보 추가 (KRW -> XRP 변환)
    try {
      const xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      const xrpPrice = xrpPriceInfo.currentPrice;
      paginatedProducts.forEach((product) => {
        product.priceXRP = (product.price / xrpPrice).toFixed(6); // KRW를 XRP로 변환
        product.priceKRW = product.price; // 원래 KRW 가격 유지
      });
      // 추가 시세 정보도 포함
      paginatedProducts.xrpPriceInfo = xrpPriceInfo;
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
      // XRP 가격을 가져올 수 없는 경우 대략적인 변환율 사용 (1 XRP = 1500 KRW)
      paginatedProducts.forEach((product) => {
        product.priceXRP = (product.price / 1500).toFixed(6);
        product.priceKRW = product.price;
      });
    }

    res.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredProducts.length / limit),
        totalProducts: filteredProducts.length,
        hasNext: endIndex < filteredProducts.length,
        hasPrev: page > 1,
      },
      categories: [...new Set(products.map((p) => p.category))],
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
 * @route GET /api/shop/products/:id
 * @desc 특정 상품 상세 조회
 * @access Public
 */
router.get("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    // XRP 가격 정보 추가 (KRW -> XRP 변환)
    try {
      const xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      const xrpPrice = xrpPriceInfo.currentPrice;
      product.priceXRP = (product.price / xrpPrice).toFixed(6); // KRW를 XRP로 변환
      product.priceKRW = product.price; // 원래 KRW 가격 유지
      product.xrpPriceInfo = xrpPriceInfo; // 상세 시세 정보 추가
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
      // XRP 가격을 가져올 수 없는 경우 대략적인 변환율 사용 (1 XRP = 1500 KRW)
      product.priceXRP = (product.price / 1500).toFixed(6);
      product.priceKRW = product.price;
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    logger.error("상품 상세 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "상품 정보를 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @route POST /api/shop/cart/add
 * @desc 장바구니에 상품 추가
 * @access Public
 */
router.post("/cart/add", (req, res) => {
  try {
    const { productId, quantity = 1, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "세션 ID가 필요합니다.",
      });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "재고가 부족합니다.",
      });
    }

    // 장바구니 가져오기 또는 생성
    if (!carts.has(sessionId)) {
      carts.set(sessionId, { items: [], createdAt: new Date().toISOString() });
    }

    const cart = carts.get(sessionId);
    const existingItem = cart.items.find(
      (item) => item.productId === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      });
    }

    cart.updatedAt = new Date().toISOString();
    carts.set(sessionId, cart);

    res.json({
      success: true,
      message: "상품이 장바구니에 추가되었습니다.",
      cart: cart,
    });
  } catch (error) {
    logger.error("장바구니 추가 실패:", error);
    res.status(500).json({
      success: false,
      message: "장바구니에 상품을 추가하는데 실패했습니다.",
    });
  }
});

/**
 * @route GET /api/shop/cart/:sessionId
 * @desc 장바구니 조회
 * @access Public
 */
router.get("/cart/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const cart = carts.get(sessionId);

    if (!cart) {
      return res.json({
        success: true,
        cart: { items: [], totalItems: 0, totalAmount: 0 },
      });
    }

    // 총 금액 계산
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // XRP 가격 정보 추가 (KRW -> XRP 변환)
    let xrpPriceInfo = null;
    let xrpPrice = null;
    let totalAmountXRP = null;
    try {
      xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      xrpPrice = xrpPriceInfo.currentPrice;
      totalAmountXRP = (totalAmount / xrpPrice).toFixed(6); // KRW를 XRP로 변환
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
      // 기본 변환율 사용 (1 XRP = 1500 KRW)
      totalAmountXRP = (totalAmount / 1500).toFixed(6);
      xrpPrice = 1500;
    }

    res.json({
      success: true,
      cart: {
        ...cart,
        totalItems,
        totalAmountKRW: totalAmount, // 장바구니 총액 (KRW)
        totalAmountXRP, // 장바구니 총액 (XRP)
        xrpPrice, // 현재 XRP 가격
        xrpPriceInfo, // XRP 상세 시세 정보
      },
    });
  } catch (error) {
    logger.error("장바구니 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "장바구니를 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @route DELETE /api/shop/cart/:sessionId/item/:productId
 * @desc 장바구니에서 상품 제거
 * @access Public
 */
router.delete("/cart/:sessionId/item/:productId", (req, res) => {
  try {
    const { sessionId, productId } = req.params;
    const cart = carts.get(sessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "장바구니를 찾을 수 없습니다.",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId !== parseInt(productId)
    );
    cart.updatedAt = new Date().toISOString();
    carts.set(sessionId, cart);

    res.json({
      success: true,
      message: "상품이 장바구니에서 제거되었습니다.",
      cart: cart,
    });
  } catch (error) {
    logger.error("장바구니 상품 제거 실패:", error);
    res.status(500).json({
      success: false,
      message: "장바구니에서 상품을 제거하는데 실패했습니다.",
    });
  }
});

/**
 * @route POST /api/shop/order/create
 * @desc 주문 생성
 * @access Public
 */
router.post("/order/create", async (req, res) => {
  try {
    const { sessionId, customerAddress, customerName, customerEmail } =
      req.body;

    if (!sessionId || !customerAddress) {
      return res.status(400).json({
        success: false,
        message: "세션 ID와 고객 주소가 필요합니다.",
      });
    }

    const cart = carts.get(sessionId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "장바구니가 비어있습니다.",
      });
    }

    // 주소 유효성 검사
    const isValidAddress = await paymentService.validateAddress(
      customerAddress
    );
    if (!isValidAddress) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 XRPL 주소입니다.",
      });
    }

    // 총 금액 계산 (KRW)
    const totalAmountKRW = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // KRW를 XRP로 변환
    let totalAmountXRP;
    let xrpPrice;
    let xrpPriceInfo;
    try {
      xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      xrpPrice = xrpPriceInfo.currentPrice;
      totalAmountXRP = parseFloat((totalAmountKRW / xrpPrice).toFixed(6));
    } catch (error) {
      logger.warn(
        "XRP 가격 정보를 가져올 수 없어 기본 변환율을 사용합니다:",
        error.message
      );
      // 기본 변환율 사용 (1 XRP = 1500 KRW)
      xrpPrice = 1500;
      totalAmountXRP = parseFloat((totalAmountKRW / 1500).toFixed(6));
    }

    // 주문 생성
    const orderId = `ORDER_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const order = {
      id: orderId,
      customerAddress,
      customerName,
      customerEmail,
      items: [...cart.items],
      totalAmountKRW, // 원화 총액
      totalAmountXRP, // XRP 총액 (결제에 사용)
      xrpPrice, // 주문 시점의 XRP 가격
      xrpPriceInfo, // XRP 상세 시세 정보
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.set(orderId, order);

    // 장바구니 비우기
    carts.delete(sessionId);

    logger.info(
      `주문 생성 완료: ${orderId} (${totalAmountKRW} KRW = ${totalAmountXRP} XRP)`
    );

    res.json({
      success: true,
      message: "주문이 생성되었습니다.",
      order: {
        id: order.id,
        totalAmountKRW,
        totalAmountXRP,
        xrpPrice,
        xrpPriceInfo,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    logger.error("주문 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "주문을 생성하는데 실패했습니다.",
    });
  }
});

/**
 * @route POST /api/shop/order/:orderId/pay
 * @desc 주문 결제 처리
 * @access Public
 */
router.post("/order/:orderId/pay", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerWalletSeed, customerAddress } = req.body;

    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "이미 처리된 주문입니다.",
      });
    }

    // 결제 처리 (XRP 금액으로 결제)
    // 먼저 paymentService를 통해 결제 요청을 생성
    const paymentRequest = await paymentService.createPaymentRequest(
      order.totalAmountXRP, // XRP 금액 사용
      `쇼핑몰 주문 결제: ${orderId}`,
      "rMerchantAddressHere" // 실제로는 쇼핑몰 지갑 주소를 사용
    );

    // 결제 처리
    const paymentResult = await paymentService.processPayment(
      paymentRequest.id, // 생성된 결제 요청 ID 사용
      customerWalletSeed,
      customerAddress
    );

    if (paymentResult.status === "completed") {
      // 주문 상태 업데이트
      order.status = "paid";
      order.paymentHash = paymentResult.transactionHash;
      order.paymentId = paymentRequest.id; // 결제 요청 ID 저장
      order.paidAmountXRP = order.totalAmountXRP; // 실제 결제된 XRP 금액
      order.paidAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
      orders.set(orderId, order);

      logger.info(
        `주문 결제 완료: ${orderId}, tx: ${paymentResult.transactionHash}`
      );

      res.json({
        success: true,
        message: "결제가 완료되었습니다.",
        order: {
          id: order.id,
          status: order.status,
          paymentHash: order.paymentHash,
          paymentId: order.paymentId,
          totalAmountKRW: order.totalAmountKRW,
          paidAmountXRP: order.paidAmountXRP,
          xrpPrice: order.xrpPrice,
          paidAt: order.paidAt,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "결제 처리에 실패했습니다.",
      });
    }
  } catch (error) {
    logger.error("주문 결제 실패:", error);
    res.status(500).json({
      success: false,
      message: error.message || "결제 처리에 실패했습니다.",
    });
  }
});

/**
 * @route GET /api/shop/order/:orderId
 * @desc 주문 상세 조회
 * @access Public
 */
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 주문에 이미 XRP/KRW 정보가 포함되어 있으므로 추가 계산 불필요
    res.json({
      success: true,
      order: {
        ...order,
        // 기존 주문에 저장된 가격 정보 사용
      },
    });
  } catch (error) {
    logger.error("주문 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "주문 정보를 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @route GET /api/shop/orders/:address
 * @desc 특정 주소의 주문 내역 조회
 * @access Public
 */
router.get("/orders/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 해당 주소의 주문들 필터링
    const userOrders = Array.from(orders.values())
      .filter((order) => order.customerAddress === address)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = userOrders.slice(startIndex, endIndex);

    // 주문에 이미 XRP/KRW 정보가 포함되어 있으므로 추가 계산 불필요
    // paginatedOrders는 이미 각 주문의 totalAmountKRW, totalAmountXRP 정보를 포함

    res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userOrders.length / limit),
        totalOrders: userOrders.length,
        hasNext: endIndex < userOrders.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("주문 내역 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "주문 내역을 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @route GET /api/shop/stats
 * @desc 쇼핑몰 통계 정보
 * @access Public
 */
router.get("/stats", async (req, res) => {
  try {
    const totalProducts = products.length;
    const totalOrders = orders.size;

    // 매출 계산 (KRW 기준과 XRP 기준 모두)
    const paidOrders = Array.from(orders.values()).filter(
      (order) => order.status === "paid"
    );
    const totalRevenueKRW = paidOrders.reduce(
      (sum, order) => sum + (order.totalAmountKRW || 0),
      0
    );
    const totalRevenueXRP = paidOrders.reduce(
      (sum, order) => sum + (order.totalAmountXRP || 0),
      0
    );

    // 현재 XRP 가격 정보
    let currentXrpPriceInfo = null;
    try {
      currentXrpPriceInfo = await cryptoPriceService.getXrpPrice();
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
    }

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenueKRW, // 실제 주문된 KRW 총액
        totalRevenueXRP, // 실제 결제된 XRP 총액
        categories: [...new Set(products.map((p) => p.category))],
        currentXrpPriceInfo, // 현재 XRP 상세 가격 정보
      },
    });
  } catch (error) {
    logger.error("통계 정보 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "통계 정보를 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
