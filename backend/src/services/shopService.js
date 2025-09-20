const logger = require('../utils/logger');
const { supabase } = require("./supabaseClient");

/**
 * 상품 목록 조회 (카테고리/검색/페이지네이션 지원)
 * @param {Object} options - 검색 옵션
 * @param {string} options.category - 카테고리 ('all' 또는 특정 카테고리)
 * @param {string} options.search - 검색어
 * @param {number} options.page - 페이지 번호 (1부터 시작)
 * @param {number} options.limit - 페이지당 항목 수
 * @returns {Promise<{data: Array, error: any, count: number}>}
 */
async function getProducts({ category = 'all', search = '', page = 1, limit = 10 }) {
    try {
      // ✅ 올바른 코드 - await 제거
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });
  
      // 카테고리 필터링
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
  
      // 검색 필터링 (상품명 또는 설명에서 검색)
      if (search && search.trim()) {
        const searchTerm = search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
  
      // 페이지네이션
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
  
      // ✅ 여기서만 await 사용하여 쿼리 실행
      const { data, error, count } = await query;
  
      if (error) {
        logger.error('상품 목록 조회 실패:', error);
        return { data: null, error, count: 0 };
      }
  
      return { data, error: null, count };
    } catch (error) {
      logger.error('상품 목록 조회 중 예외 발생:', error);
      return { data: null, error, count: 0 };
    }
}  

/**
 * 상품 상세 조회
 * @param {number} id - 상품 ID
 * @returns {Promise<{data: Object|null, error: any}>}
 */
async function getProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 "not found" 에러
      logger.error(`상품 상세 조회 실패 (ID: ${id}):`, error);
    }

    return { data, error };
  } catch (error) {
    logger.error(`상품 상세 조회 중 예외 발생 (ID: ${id}):`, error);
    return { data: null, error };
  }
}

/**
 * 사용 가능한 카테고리 목록 조회
 * @returns {Promise<{data: Array, error: any}>}
 */
async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    if (error) {
      logger.error('카테고리 목록 조회 실패:', error);
      return { data: [], error };
    }

    // 중복 제거
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    return { data: uniqueCategories, error: null };
  } catch (error) {
    logger.error('카테고리 목록 조회 중 예외 발생:', error);
    return { data: [], error };
  }
}

/**
 * 상품 재고 확인
 * @param {number} productId - 상품 ID
 * @param {number} quantity - 필요한 수량
 * @returns {Promise<{available: boolean, currentStock: number, error: any}>}
 */
async function checkStock(productId, quantity) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error(`재고 확인 실패 (ID: ${productId}):`, error);
      return { available: false, currentStock: 0, error };
    }

    const available = data.stock >= quantity;
    return { available, currentStock: data.stock, error: null };
  } catch (error) {
    logger.error(`재고 확인 중 예외 발생 (ID: ${productId}):`, error);
    return { available: false, currentStock: 0, error };
  }
}

/**
 * 상품 재고 업데이트 (주문 시 재고 차감)
 * @param {number} productId - 상품 ID
 * @param {number} quantity - 차감할 수량
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function updateStock(productId, quantity) {
  try {
    // 현재 재고 확인
    const { available, currentStock, error: stockError } = await checkStock(productId, quantity);
    
    if (stockError) {
      return { success: false, error: stockError };
    }

    if (!available) {
      return { 
        success: false, 
        error: { message: '재고가 부족합니다.', currentStock } 
      };
    }

    // 재고 차감
    const { data, error } = await supabase
      .from('products')
      .update({ 
        stock: currentStock - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select();

    if (error) {
      logger.error(`재고 업데이트 실패 (ID: ${productId}):`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error(`재고 업데이트 중 예외 발생 (ID: ${productId}):`, error);
    return { success: false, error };
  }
}

/**
 * 쇼핑몰 통계 조회
 * @returns {Promise<{data: Object, error: any}>}
 */
async function getShopStats() {
  try {
    // 총 상품 수 조회
    const { count: totalProducts, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (productError) {
      throw productError;
    }

    // 카테고리 목록 조회
    const { data: categories, error: categoryError } = await getCategories();
    
    if (categoryError) {
      throw categoryError;
    }

    return {
      data: {
        totalProducts: totalProducts || 0,
        categories
      },
      error: null
    };
  } catch (error) {
    logger.error('쇼핑몰 통계 조회 실패:', error);
    return { data: null, error };
  }
}

/**
 * 장바구니 세션 생성/업데이트
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function createOrUpdateCartSession(sessionId) {
  try {
    const { error } = await supabase
      .from('cart_sessions')
      .upsert({
        session_id: sessionId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' });

    if (error) {
      logger.error(`장바구니 세션 생성/업데이트 실패 (${sessionId}):`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error(`장바구니 세션 처리 중 예외 발생 (${sessionId}):`, error);
    return { success: false, error };
  }
}

/**
 * 장바구니에 상품 추가/업데이트
 * @param {string} sessionId - 세션 ID
 * @param {number} productId - 상품 ID
 * @param {number} quantity - 수량
 * @returns {Promise<{success: boolean, cart: Object, error: any}>}
 */
async function addToCart(sessionId, productId, quantity = 1) {
  try {
    // 1. 상품 정보 조회
    const { data: product, error: productError } = await getProductById(productId);
    if (productError || !product) {
      return { success: false, error: { message: "상품을 찾을 수 없습니다." } };
    }

    // 2. 재고 확인
    const { available, currentStock, error: stockError } = await checkStock(productId, quantity);
    if (stockError) {
      return { success: false, error: { message: "재고 확인 중 오류가 발생했습니다." } };
    }

    if (!available) {
      return { success: false, error: { message: `재고가 부족합니다. (현재 재고: ${currentStock})` } };
    }

    // 3. 장바구니 세션 생성/업데이트
    const { success: sessionSuccess, error: sessionError } = await createOrUpdateCartSession(sessionId);
    if (!sessionSuccess) {
      return { success: false, error: sessionError };
    }

    // 4. 기존 장바구니 아이템 확인
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('product_id', productId)
      .single();

    let result;
    if (existingItem) {
      // 기존 아이템 수량 업데이트
      const newQuantity = existingItem.quantity + quantity;
      
      // 새로운 수량으로 재고 재확인
      const { available: newAvailable, currentStock: newCurrentStock } = await checkStock(productId, newQuantity);
      if (!newAvailable) {
        return { success: false, error: { message: `재고가 부족합니다. (현재 재고: ${newCurrentStock})` } };
      }

      result = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select();
    } else {
      // 새 아이템 추가
      result = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          product_id: productId,
          quantity: quantity,
          price_snapshot: parseFloat(product.price)
        })
        .select();
    }

    if (result.error) {
      logger.error('장바구니 아이템 추가/업데이트 실패:', result.error);
      return { success: false, error: result.error };
    }

    // 5. 업데이트된 장바구니 정보 반환
    const { data: cart, error: cartError } = await getCartBySessionId(sessionId);
    if (cartError) {
      return { success: false, error: cartError };
    }

    return { success: true, cart, error: null };
  } catch (error) {
    logger.error('장바구니 추가 중 예외 발생:', error);
    return { success: false, error };
  }
}

/**
 * 세션별 장바구니 조회
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<{data: Object, error: any}>}
 */
async function getCartBySessionId(sessionId) {
  try {
    // 1. 장바구니 세션 정보 조회
    const { data: session, error: sessionError } = await supabase
      .from('cart_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      logger.error(`장바구니 세션 조회 실패 (${sessionId}):`, sessionError);
      return { data: null, error: sessionError };
    }

    // 세션이 없으면 빈 장바구니 반환
    if (!session) {
      return {
        data: {
          session_id: sessionId,
          items: [],
          totalItems: 0,
          totalAmountKRW: 0,
          createdAt: null,
          updatedAt: null
        },
        error: null
      };
    }

    // 2. 장바구니 아이템들과 상품 정보 조회
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          image,
          stock,
          is_active
        )
      `)
      .eq('session_id', sessionId);

    if (itemsError) {
      logger.error(`장바구니 아이템 조회 실패 (${sessionId}):`, itemsError);
      return { data: null, error: itemsError };
    }

    // 3. 장바구니 데이터 가공
    const items = cartItems.map(item => ({
      productId: item.product_id,
      name: item.products?.name || 'Unknown Product',
      price: parseFloat(item.price_snapshot),
      quantity: item.quantity,
      image: item.products?.image || null,
      isActive: item.products?.is_active || false,
      currentStock: item.products?.stock || 0
    }));

    // 총 수량 및 총 금액 계산
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmountKRW = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      data: {
        session_id: sessionId,
        items,
        totalItems,
        totalAmountKRW,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      },
      error: null
    };
  } catch (error) {
    logger.error(`장바구니 조회 중 예외 발생 (${sessionId}):`, error);
    return { data: null, error };
  }
}

/**
 * 장바구니에서 상품 제거
 * @param {string} sessionId - 세션 ID
 * @param {number} productId - 상품 ID
 * @returns {Promise<{success: boolean, cart: Object, error: any}>}
 */
async function removeCartItem(sessionId, productId) {
  try {
    // 아이템 삭제
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('session_id', sessionId)
      .eq('product_id', productId);

    if (error) {
      logger.error(`장바구니 아이템 삭제 실패 (${sessionId}, ${productId}):`, error);
      return { success: false, error };
    }

    // 세션 업데이트 시간 갱신
    await supabase
      .from('cart_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    // 업데이트된 장바구니 정보 반환
    const { data: cart, error: cartError } = await getCartBySessionId(sessionId);
    if (cartError) {
      return { success: false, error: cartError };
    }

    return { success: true, cart, error: null };
  } catch (error) {
    logger.error(`장바구니 아이템 제거 중 예외 발생 (${sessionId}, ${productId}):`, error);
    return { success: false, error };
  }
}

/**
 * 장바구니 전체 비우기
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function clearCart(sessionId) {
  try {
    // 모든 장바구니 아이템 삭제
    const { error: itemsError } = await supabase
      .from('cart_items')
      .delete()
      .eq('session_id', sessionId);

    if (itemsError) {
      logger.error(`장바구니 아이템 전체 삭제 실패 (${sessionId}):`, itemsError);
      return { success: false, error: itemsError };
    }

    // 장바구니 세션도 삭제 (선택사항)
    const { error: sessionError } = await supabase
      .from('cart_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (sessionError) {
      logger.warn(`장바구니 세션 삭제 실패 (${sessionId}):`, sessionError);
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error(`장바구니 비우기 중 예외 발생 (${sessionId}):`, error);
    return { success: false, error };
  }
}

// 기존 module.exports에 새 함수들 추가
module.exports = {
  getProducts,
  getProductById,
  getCategories,
  checkStock,
  updateStock,
  getShopStats,
  // 장바구니 관련 함수들 추가
  addToCart,
  getCartBySessionId,
  removeCartItem,
  clearCart,
  createOrUpdateCartSession
};