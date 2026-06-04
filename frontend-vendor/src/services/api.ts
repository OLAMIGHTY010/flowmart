import axios from "axios";
import type { AxiosRequestConfig, AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

// import { API_BASE_URL } from '';

/**
 * Setup Axios interceptors for JWT,
 * Response Interceptor: Handles expired tokens globally
 * If 401, the token is likely expired or invalid
 * Clear local storage and trigger global logout
 */

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "http://localhost:3000/api",
      //   withCredentials: false, 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401) {
          console.warn('Unauthorized: Token expired or invalid.');

          localStorage.removeItem('accessToken');
          window.dispatchEvent(new Event('auth:logout'));
        }

        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get<T>(url, config).then(res => res.data);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.post<T>(url, data, config).then(res => res.data);
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put<T>(url, data, config).then(res => res.data);
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete<T>(url, config).then(res => res.data);
  }
}

export const apiClient = new ApiClient();