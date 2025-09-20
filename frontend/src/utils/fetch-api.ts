const BASE_URL = import.meta.env?.VITE_APP_API_URL ?? "http://localhost:3000";

export type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string | number>;
};

const fetchApi = async <T>(
  endpoint: string, // 기존 url 대신 endpoint만 받음
  options: FetchOptions = {},
  isExternal?: boolean
): Promise<T> => {
  let externalUrl = BASE_URL;

  if (isExternal) {
    externalUrl = endpoint;
    endpoint = "";
  }

  try {
    const {
      method = "GET",
      headers = { "Content-Type": "application/json" },
      body,
      queryParams,
    } = options;

    // Query Params 처리
    const queryString = queryParams
      ? "?" +
        new URLSearchParams(
          Object.entries(queryParams).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: String(value),
            }),
            {}
          )
        ).toString()
      : "";

    // Base URL과 endpoint 결합
    const fullUrl = `${externalUrl}${endpoint}${queryString}`;

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    console.error("Fetch API error:", error);
    throw error;
  }
};

export default fetchApi;
