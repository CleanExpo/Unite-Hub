/**
 * Unified API Client
 * A centralized client for making HTTP requests to third-party APIs with built-in
 * connection pooling, authentication, rate limiting, and error handling.
 */

import { z } from 'zod';
import { RateLimiter } from './ratelimit';
import { RetryStrategy } from './retry';
import { validateResponse } from './validation';

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Basic request options
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: any;
  timeout?: number;
  retryStrategy?: RetryStrategy;
  validateSchema?: z.ZodType<any>;
  cache?: RequestCache;
}

// API Client configuration
export interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  rateLimiter?: RateLimiter;
  retryStrategy?: RetryStrategy;
  authStrategy?: AuthStrategy;
  debug?: boolean;
}

// Authentication strategy interface
export interface AuthStrategy {
  getAuthHeaders(): Promise<Record<string, string>>;
  refreshAuth?(): Promise<void>;
  isTokenExpired?(): boolean;
}

/**
 * ApiClient class for making HTTP requests
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private rateLimiter?: RateLimiter;
  private retryStrategy?: RetryStrategy;
  private authStrategy?: AuthStrategy;
  private debug: boolean;
  private abortControllers: Set<AbortController> = new Set();

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.rateLimiter = config.rateLimiter;
    this.retryStrategy = config.retryStrategy;
    this.authStrategy = config.authStrategy;
    this.debug = config.debug || false;
  }

  /**
   * Make an HTTP request
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const url = this.buildUrl(endpoint, options.params);
    
    // Get auth headers if auth strategy is provided
    const authHeaders = this.authStrategy 
      ? await this.authStrategy.getAuthHeaders() 
      : {};
    
    // Create abort controller for timeout
    const controller = new AbortController();
    this.abortControllers.add(controller);
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.abortControllers.delete(controller);
    }, options.timeout || this.timeout);
    
    try {
      // Apply rate limiting if configured
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }
      
      // Create fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          ...options.headers,
        },
        signal: controller.signal,
        cache: options.cache,
      };
      
      // Add body for non-GET requests
      if (method !== 'GET' && options.body !== undefined) {
        fetchOptions.body = typeof options.body === 'string' 
          ? options.body 
          : JSON.stringify(options.body);
      }
      
      // Log request in debug mode
      if (this.debug) {
        console.log(`[ApiClient] ${method} ${url}`, {
          headers: fetchOptions.headers,
          body: options.body,
        });
      }
      
      // Retry strategy
      const retryStrategy = options.retryStrategy || this.retryStrategy;
      
      if (retryStrategy) {
        return await this.executeWithRetry<T>(url, fetchOptions, retryStrategy, options.validateSchema);
      } else {
        // Execute the request
        const response = await fetch(url, fetchOptions);
        return await this.processResponse<T>(response, options.validateSchema);
      }
    } finally {
      clearTimeout(timeoutId);
      this.abortControllers.delete(controller);
      
      // Release rate limit if configured
      if (this.rateLimiter) {
        this.rateLimiter.release();
      }
    }
  }

  /**
   * Execute a request with retry strategy
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    retryStrategy: RetryStrategy,
    schema?: z.ZodType<any>
  ): Promise<T> {
    let lastError: any;
    let attempt = 0;
    
    while (attempt < retryStrategy.maxRetries) {
      try {
        // Increment attempt counter
        attempt++;
        
        // Execute the request
        const response = await fetch(url, options);
        
        // If response is successful, process and return
        if (response.ok) {
          return await this.processResponse<T>(response, schema);
        }
        
        // If response status is in the non-retryable list, throw immediately
        if (retryStrategy.nonRetryableStatuses?.includes(response.status)) {
          throw new ApiError(
            `Request failed with status ${response.status}`,
            response.status,
            await this.getResponseBody(response)
          );
        }
        
        // Store the error for possible re-throw
        lastError = new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
          await this.getResponseBody(response)
        );
        
        // If we've reached max retries, throw the last error
        if (attempt >= retryStrategy.maxRetries) {
          throw lastError;
        }
        
        // Calculate backoff delay
        const delay = retryStrategy.calculateDelay(attempt);
        
        // Log retry in debug mode
        if (this.debug) {
          console.log(`[ApiClient] Retrying request (${attempt}/${retryStrategy.maxRetries}) after ${delay}ms`);
        }
        
        // Wait for the backoff delay
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        // Store the error for possible re-throw
        lastError = error;
        
        // If the error is not retryable, throw immediately
        if (!retryStrategy.isRetryable(error)) {
          throw error;
        }
        
        // If we've reached max retries, throw the last error
        if (attempt >= retryStrategy.maxRetries) {
          throw lastError;
        }
        
        // Calculate backoff delay
        const delay = retryStrategy.calculateDelay(attempt);
        
        // Log retry in debug mode
        if (this.debug) {
          console.log(`[ApiClient] Retrying request (${attempt}/${retryStrategy.maxRetries}) after ${delay}ms`);
        }
        
        // Wait for the backoff delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError;
  }

  /**
   * Process the response
   */
  private async processResponse<T>(
    response: Response,
    schema?: z.ZodType<any>
  ): Promise<T> {
    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        await this.getResponseBody(response)
      );
    }
    
    // Parse response based on content type
    const contentType = response.headers.get('content-type') || '';
    let data: any;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      // For binary data or other types, return the raw response
      return response as unknown as T;
    }
    
    // Validate response if schema is provided
    if (schema) {
      try {
        data = validateResponse(data, schema);
      } catch (error) {
        throw new ApiError(
          'Response validation failed',
          response.status,
          data,
          error
        );
      }
    }
    
    // Log response in debug mode
    if (this.debug) {
      console.log(`[ApiClient] Response:`, data);
    }
    
    return data as T;
  }

  /**
   * Get response body as text or object
   */
  private async getResponseBody(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type') || '';
      const clone = response.clone();
      
      if (contentType.includes('application/json')) {
        return await clone.json();
      } else {
        return await clone.text();
      }
    } catch (error) {
      return 'Unable to parse response body';
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    // Ensure the baseUrl doesn't end with a slash and endpoint doesn't start with a slash
    const normalizedBaseUrl = this.baseUrl.endsWith('/') 
      ? this.baseUrl.slice(0, -1) 
      : this.baseUrl;
    
    const normalizedEndpoint = endpoint.startsWith('/') 
      ? endpoint.slice(1) 
      : endpoint;
    
    // Combine baseUrl and endpoint
    let url = `${normalizedBaseUrl}/${normalizedEndpoint}`;
    
    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      }
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  /**
   * Convenience method for GET requests
   */
  public async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  public async post<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * Convenience method for PUT requests
   */
  public async put<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * Convenience method for PATCH requests
   */
  public async patch<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * Convenience method for DELETE requests
   */
  public async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Cancel all pending requests
   */
  public cancelAllRequests(): void {
    Array.from(this.abortControllers).forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
  }
}

/**
 * API Error class
 */
export class ApiError extends Error {
  public status: number;
  public data: any;
  public validationError?: any;

  constructor(message: string, status: number, data: any, validationError?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.validationError = validationError;
  }
}
