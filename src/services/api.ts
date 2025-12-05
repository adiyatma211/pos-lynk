import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Type definitions for API responses
export interface ApiResponse<T = any> {
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

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
      (error) => {
        const errorData = this.handleError(error);
        // Error will be handled by individual services (TransactionService, etc.)
        // No need to log here to avoid duplicate console errors
        return Promise.reject(errorData);
      }
    );
  }

  private handleError(error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        message: error.response.data.message || 'Server error',
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
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        message: error.message || 'Request error',
        status: 0,
        data: null,
      };
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/health');
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;