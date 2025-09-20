import fetchApi from "../utils/fetch-api";

// XRPL 계정 정보 타입 정의
export interface XRPLAccount {
  address: string;
  secret: string;
  publicKey: string;
  privateKey: string;
  balance: number;
  balanceXRP: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sequence: number;
  ownerCount: number;
  flags: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * XRPL 계정 생성
 * @param nickname 사용자 닉네임
 */
export const createXRPLAccount = async (
  nickname: string
): Promise<XRPLAccount> => {
  const response = await fetchApi<ApiResponse<XRPLAccount>>(
    "/api/account/create",
    {
      method: "POST",
      body: { nickname },
    }
  );
  return response.data;
};

/**
 * XRPL 계정 조회 (사용자 ID 기반)
 * @param userId 사용자 ID
 */
export const getXRPLAccount = async (userId: string): Promise<XRPLAccount> => {
  const response = await fetchApi<ApiResponse<XRPLAccount>>(
    `/api/account/${userId}`
  );
  return response.data;
};

/**
 * XRPL 계정 조회 (주소 기반)
 * @param address XRPL 주소
 */
export const getXRPLAccountByAddress = async (
  address: string
): Promise<XRPLAccount> => {
  const response = await fetchApi<ApiResponse<XRPLAccount>>(
    `/api/account/${address}`
  );
  return response.data;
};

/**
 * XRPL 계정 잔액 조회
 * @param address XRPL 주소
 */
export const getXRPLBalance = async (
  address: string
): Promise<{ balance: number; balanceXRP: number }> => {
  const response = await fetchApi<
    ApiResponse<{ balance: number; balanceXRP: number }>
  >(`/api/account/balance/${address}`);
  return response.data;
};

/**
 * XRPL 계정 목록 조회
 */
export const getXRPLAccounts = async (): Promise<XRPLAccount[]> => {
  const response = await fetchApi<ApiResponse<XRPLAccount[]>>(
    "/api/account/list"
  );
  return response.data;
};

/**
 * XRPL 계정 정보 업데이트
 * @param address XRPL 주소
 */
export const refreshXRPLAccount = async (
  address: string
): Promise<XRPLAccount> => {
  const response = await fetchApi<ApiResponse<XRPLAccount>>(
    `/api/account/refresh/${address}`,
    {
      method: "POST",
    }
  );
  return response.data;
};

interface PaymentVerificationRequest {
  amount: number;
  products_id: number;
}

interface PaymentVerificationResponse {
  success: boolean;
  data: {
    status: "success" | "failed";
    message: string;
    transactionHash?: string;
  };
}

/**
 * XRP 결제 검증
 * @param address XRPL 주소
 * @param data 결제 검증 데이터
 */
export const verifyPayment = async (
  address: string,
  data: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> => {
  const response = await fetchApi<PaymentVerificationResponse>(
    `/api/account/${address}/payment`,
    {
      method: "POST",
      body: data,
    }
  );
  return response;
};
