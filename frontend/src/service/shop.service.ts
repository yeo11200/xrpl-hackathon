// shop.service.ts
import fetchApi from "../utils/fetch-api";

export type Product = {
  id: number;
  name: string;
  description: string[];
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type ShopListResponse = {
  success: boolean;
  products: Product[];
  pagination: Pagination;
  categories: string[];
};

type ShopDetailResponse = {
  success: boolean;
  product: Product;
};

export async function fetchProductList(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ShopListResponse> {
  const query = new URLSearchParams();

  if (params?.category) query.append("category", params.category);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  return await fetchApi<ShopListResponse>(
    `/api/shop/products?${query.toString()}`
  );
}

// --- 2) 상세 조회 함수 ---
// GET /api/shop/products/:id  → { success, product }
export const getProductById = async (
  id: number | string
): Promise<ShopDetailResponse> => {
  const safeId = typeof id === "string" ? id.trim() : String(id);
  return await fetchApi<ShopDetailResponse>(`/api/shop/products/${safeId}`);
};
