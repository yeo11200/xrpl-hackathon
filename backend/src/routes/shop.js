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
/**
 * @api {get} /api/shop/products 01. 상품 목록 조회
 * @apiName GetProducts
 * @apiGroup Shop
 * @apiDescription 카테고리/검색/페이지네이션으로 상품 목록을 조회합니다. XRP 시세를 반영해 KRW→XRP 가격을 포함합니다.
 *
 * @apiParam {String} [category=all] 카테고리 (query)
 * @apiParam {String} [search] 검색어 (query)
 * @apiParam {Number} [page=1] 페이지 번호 (query)
 * @apiParam {Number} [limit=10] 페이지 당 개수 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object[]} products 상품 목록
 * @apiSuccess {Number} products.id 상품 ID
 * @apiSuccess {String} products.name 상품명
 * @apiSuccess {String} products.description 설명
 * @apiSuccess {String} products.category 카테고리
 * @apiSuccess {Number} products.priceKRW 가격(KRW)
 * @apiSuccess {String} products.priceXRP 가격(XRP, 소수 6자리 문자열)
 * @apiSuccess {String} [products.image] 이미지 URL
 * @apiSuccess {Number} [products.stock] 재고
 * @apiSuccess {Object} pagination 페이지네이션 정보
 * @apiSuccess {Number} pagination.currentPage 현재 페이지
 * @apiSuccess {Number} pagination.totalPages 전체 페이지 수
 * @apiSuccess {Number} pagination.totalProducts 전체 상품 수
 * @apiSuccess {Boolean} pagination.hasNext 다음 페이지 여부
 * @apiSuccess {Boolean} pagination.hasPrev 이전 페이지 여부
 * @apiSuccess {String[]} categories 사용 가능한 카테고리 목록
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
 * @api {get} /api/shop/products/:id 02. 상품 상세 조회
 * @apiName GetProductDetail
 * @apiGroup Shop
 * @apiDescription 특정 상품의 상세 정보를 조회합니다. XRP 시세 기준 가격을 포함합니다.
 *
 * @apiParam {Number} id 상품 ID (URL path parameter)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} product 상품 정보
 * @apiSuccess {Number} product.id 상품 ID
 * @apiSuccess {String} product.name 상품명
 * @apiSuccess {String} product.description 설명
 * @apiSuccess {String} product.category 카테고리
 * @apiSuccess {Number} product.priceKRW 가격(KRW)
 * @apiSuccess {String} product.priceXRP 가격(XRP, 소수 6자리 문자열)
 * @apiSuccess {String} [product.image] 이미지 URL
 * @apiSuccess {Number} [product.stock] 재고
 * @apiSuccess {Object} [product.xrpPriceInfo] XRP 시세 정보
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
 * @api {post} /api/shop/cart/add 03. 장바구니에 상품 추가
 * @apiName AddToCart
 * @apiGroup Shop
 * @apiDescription 세션 장바구니에 상품을 추가합니다.
 *
 * @apiBody {String} sessionId 세션 ID
 * @apiBody {Number} productId 상품 ID
 * @apiBody {Number} [quantity=1] 수량
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} cart 장바구니 정보
 * @apiSuccess {Object[]} cart.items 장바구니 항목
 * @apiSuccess {Number} cart.items.productId 상품 ID
 * @apiSuccess {String} cart.items.name 상품명
 * @apiSuccess {Number} cart.items.price 가격(KRW)
 * @apiSuccess {Number} cart.items.quantity 수량
 * @apiSuccess {String} [cart.items.image] 이미지 URL
 * @apiSuccess {String} cart.createdAt 생성 시각
 * @apiSuccess {String} cart.updatedAt 갱신 시각
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
 * @api {get} /api/shop/cart/:sessionId 04. 장바구니 조회
 * @apiName GetCart
 * @apiGroup Shop
 * @apiDescription 세션 장바구니 정보를 조회합니다. 총액의 KRW/XRP 변환 정보를 포함합니다.
 *
 * @apiParam {String} sessionId 세션 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} cart 장바구니 정보
 * @apiSuccess {Object[]} cart.items 항목 배열
 * @apiSuccess {Number} cart.totalItems 총 수량
 * @apiSuccess {Number} cart.totalAmountKRW 총액(KRW)
 * @apiSuccess {String} cart.totalAmountXRP 총액(XRP, 문자열)
 * @apiSuccess {Number} cart.xrpPrice 사용된 XRP 가격(KRW)
 * @apiSuccess {Object} [cart.xrpPriceInfo] XRP 시세 정보
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
 * @api {delete} /api/shop/cart/:sessionId/item/:productId 05. 장바구니 상품 제거
 * @apiName RemoveCartItem
 * @apiGroup Shop
 * @apiDescription 세션 장바구니에서 특정 상품을 제거합니다.
 *
 * @apiParam {String} sessionId 세션 ID
 * @apiParam {Number} productId 상품 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} cart 장바구니 정보
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
 * @api {post} /api/shop/order/create 06. 주문 생성
 * @apiName CreateOrder
 * @apiGroup Shop
 * @apiDescription 장바구니 기반으로 주문을 생성합니다. 총액 KRW/XRP 및 당시 XRP 시세 정보를 포함합니다.
 *
 * @apiBody {String} sessionId 세션 ID
 * @apiBody {String} customerAddress 고객 XRPL 주소
 * @apiBody {String} [customerName] 고객 이름
 * @apiBody {String} [customerEmail] 고객 이메일
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} order 주문 요약
 * @apiSuccess {String} order.id 주문 ID
 * @apiSuccess {Number} order.totalAmountKRW 총액(KRW)
 * @apiSuccess {Number} order.totalAmountXRP 총액(XRP)
 * @apiSuccess {Number} order.xrpPrice 주문 시 XRP 가격(KRW)
 * @apiSuccess {Object} [order.xrpPriceInfo] 주문 시 XRP 시세 정보
 * @apiSuccess {String} order.status 주문 상태
 * @apiSuccess {String} order.createdAt 생성 시각
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
 * @api {post} /api/shop/order/:orderId/pay 07. 주문 결제 처리
 * @apiName PayOrder
 * @apiGroup Shop
 * @apiDescription 주문 금액(XRP)으로 결제를 수행합니다. 내부적으로 결제 요청을 생성/처리합니다.
 *
 * @apiParam {String} orderId 주문 ID
 * @apiBody {String} customerWalletSeed 고객 지갑 시드
 * @apiBody {String} customerAddress 고객 XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} order 주문 결제 결과 요약
 * @apiSuccess {String} order.id 주문 ID
 * @apiSuccess {String} order.status 주문 상태(paid)
 * @apiSuccess {String} order.paymentHash 결제 트랜잭션 해시
 * @apiSuccess {String} order.paymentId 결제 요청 ID
 * @apiSuccess {Number} order.totalAmountKRW 주문 총액(KRW)
 * @apiSuccess {Number} order.paidAmountXRP 결제 금액(XRP)
 * @apiSuccess {Number} order.xrpPrice 결제 시점 XRP 가격(KRW)
 * @apiSuccess {String} order.paidAt 결제 완료 시각
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
 * @api {get} /api/shop/order/:orderId 08. 주문 상세 조회
 * @apiName GetOrderDetail
 * @apiGroup Shop
 * @apiDescription 주문 상세 정보를 조회합니다. 주문 생성 시의 XRP/KRW 가격 정보 포함.
 *
 * @apiParam {String} orderId 주문 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} order 주문 전체 정보
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
 * @api {get} /api/shop/orders/:address 09. 주소별 주문 내역 조회
 * @apiName GetOrdersByAddress
 * @apiGroup Shop
 * @apiDescription 고객 주소 기준 주문 내역을 페이지네이션으로 조회합니다.
 *
 * @apiParam {String} address 고객 XRPL 주소
 * @apiParam {Number} [page=1] 페이지 번호 (query)
 * @apiParam {Number} [limit=10] 페이지 당 개수 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object[]} orders 주문 목록 (최신순)
 * @apiSuccess {Object} pagination 페이지네이션 정보
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
 * @api {get} /api/shop/stats 10. 쇼핑몰 통계 정보
 * @apiName GetShopStats
 * @apiGroup Shop
 * @apiDescription 상품/주문/매출 등 기본 통계와 현재 XRP 시세 정보를 조회합니다.
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} stats 통계 정보
 * @apiSuccess {Number} stats.totalProducts 총 상품 수
 * @apiSuccess {Number} stats.totalOrders 총 주문 수
 * @apiSuccess {Number} stats.totalRevenueKRW 총 매출(KRW)
 * @apiSuccess {Number} stats.totalRevenueXRP 총 매출(XRP)
 * @apiSuccess {String[]} stats.categories 카테고리 목록
 * @apiSuccess {Object} [stats.currentXrpPriceInfo] 현재 XRP 시세 정보
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
