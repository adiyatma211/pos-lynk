import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authService } from './authService';
import { TokenRefreshQueue } from '@/types/auth';

// Type definitions for API responses
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

// API Client Configuration
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: TokenRefreshQueue[] = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add current location header if available
        const currentLocation = authService.getCurrentLocation();
        if (currentLocation) {
          config.headers['X-Location-ID'] = currentLocation.id;
        }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          this.isRefreshing = true;
          originalRequest._retry = true;

          try {
            const newToken = await authService.refreshToken();
            this.client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => {
              resolve(this.client(originalRequest));
            });
            this.failedQueue = [];
            
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];
            
            // Redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        const errorData = this.handleError(error);
        return Promise.reject(errorData);
      }
    );
  }

  private handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
          message: error.response.data?.message || 'Server error',
          status: error.response.status,
          data: error.response.data,
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          message: 'No response from server',
          status: 0,
          data: null,
        };
      }
    }
    
    // Something happened in setting up the request that triggered an Error
    return {
      message: error instanceof Error ? error.message : 'Request error',
      status: 0,
      data: null,
    };
  }

  // HTTP Methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/v1/health');
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;