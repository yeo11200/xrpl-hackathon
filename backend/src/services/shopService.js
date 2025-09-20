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

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  checkStock,
  updateStock,
  getShopStats
};
