import fetchApi from "../utils/fetch-api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CredentialAcceptRequest {
  subjectSeed: string;
  issuerAddress: string;
  credentialType: string;
}

interface CredentialAcceptResponse {
  success: boolean;
  transaction; // 트랜잭션 정보의 정확한 타입은 필요에 따라 정의
}

/**
 * 자격증명 수락
 * @param request 자격증명 수락 요청 데이터
 */
export const acceptCredential = async (
  request: CredentialAcceptRequest
): Promise<CredentialAcceptResponse> => {
  const response = await fetchApi<ApiResponse<CredentialAcceptResponse>>(
    "/api/credential/accept",
    {
      method: "POST",
      body: request,
    }
  );
  return response.data;
};
