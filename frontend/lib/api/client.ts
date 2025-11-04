import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
const TOKEN_NAME = process.env.NEXT_PUBLIC_AUTH_TOKEN_NAME || "token";

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Create a configured Axios instance for API requests.
 *
 * The instance uses the module API base URL, sets default JSON content headers
 * (including an ngrok bypass header), applies a 30s timeout, attaches an
 * auth token from localStorage to requests when running in a browser, and
 * converts response failures into APIError instances with status and response
 * data when available.
 *
 * @returns The configured Axios instance with base URL, default headers, timeout, request auth injection, and standardized error handling.
 */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning page
    },
    timeout: 30000,
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      // Only add token in browser environment
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(TOKEN_NAME);
        if (token) {
          config.headers["x-auth-token"] = token;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        // Server responded with error status
        const responseData = error.response.data as { message?: string } | undefined;
        const message = responseData?.message || error.message || "An error occurred";
        throw new APIError(message, error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        throw new APIError("No response from server. Please check your connection.");
      } else {
        // Something else happened
        throw new APIError(error.message || "An unexpected error occurred");
      }
    }
  );

  return instance;
}

// Create the API client instance
const apiClient = createAxiosInstance();

/**
 * Generic GET request
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.get(url, config);
  return response.data;
}

/**
 * Generic POST request
 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.post(url, data, config);
  return response.data;
}

/**
 * Generic PUT request
 */
export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.put(url, data, config);
  return response.data;
}

/**
 * Generic PATCH request
 */
export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.patch(url, data, config);
  return response.data;
}

/**
 * Generic DELETE request
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.delete(url, config);
  return response.data;
}

/**
 * Helper to get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_NAME);
}

/**
 * Helper to set auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_NAME, token);
}

/**
 * Helper to remove auth token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_NAME);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export default apiClient;