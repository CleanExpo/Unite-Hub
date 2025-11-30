/**
 * Mock Fetch Utility for Testing
 * Provides a mockable fetch function for unit and integration tests
 */

export interface MockFetchOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<any>;
  text?: () => Promise<string>;
  blob?: () => Promise<Blob>;
  arrayBuffer?: () => Promise<ArrayBuffer>;
  clone?: () => Response;
  headers?: Headers;
}

export interface MockFetchResponse extends Omit<Response, 'json' | 'text' | 'blob' | 'arrayBuffer'> {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
  blob?: () => Promise<Blob>;
  arrayBuffer?: () => Promise<ArrayBuffer>;
  clone?: () => MockFetchResponse;
  headers: Headers;
}

export class MockFetch {
  private responses: MockFetchResponse[] = [];
  private responseQueue: MockFetchResponse[] = [];
  private callCount = 0;
  private calls: Array<{ url: string; options: RequestInit }> = [];

  constructor() {
    this.mockReset();
  }

  mockResolvedValue(response: MockFetchOptions): this {
    const mockResponse = this.createMockResponse(response);
    this.responses.push(mockResponse);
    this.responseQueue.push(mockResponse);
    return this;
  }

  mockResolvedValueOnce(response: MockFetchOptions): this {
    const mockResponse = this.createMockResponse(response);
    this.responseQueue.push(mockResponse);
    return this;
  }

  private createMockResponse(response: MockFetchOptions): MockFetchResponse {
    return {
      ok: response.ok !== undefined ? response.ok : true,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      json: response.json || (async () => ({})),
      text: response.text || (async () => ''),
      headers: response.headers || new Headers(),
      clone: function() {
        return { ...this };
      },
      ...response,
    } as MockFetchResponse;
  }

  mockRejectedValue(error: Error): this {
    this.responses.push({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw error;
      },
      text: async () => {
        throw error;
      },
      headers: new Headers(),
      clone: function() {
        return { ...this };
      },
    } as MockFetchResponse);
    return this;
  }

  mockImplementation(fn: (url: string, options?: RequestInit) => Promise<Response>): this {
    // Store the implementation for later use
    (this as any)._implementation = fn;
    return this;
  }

  async call(url: string, options?: RequestInit): Promise<Response> {
    this.callCount++;
    this.calls.push({ url, options: options || {} });

    // If custom implementation exists, use it
    if ((this as any)._implementation) {
      return (this as any)._implementation(url, options);
    }

    // Return next response from queue (supports mockResolvedValueOnce)
    if (this.responseQueue.length > 0) {
      return this.responseQueue.shift() as MockFetchResponse;
    }

    // Fallback to responses array if queue is empty (for mockResolvedValue)
    if (this.responses.length > 0) {
      const response = this.responses[0];
      return response;
    }

    // Default response
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      text: async () => '',
      headers: new Headers(),
      clone: function() {
        return { ...this };
      },
    } as MockFetchResponse;
  }

  mock() {
    const self = this;
    // Override global fetch for testing
    (globalThis as any).fetch = (url: string, options?: RequestInit) =>
      self.call(url, options);
  }

  mockReset(): this {
    this.responses = [];
    this.callCount = 0;
    this.calls = [];
    (this as any)._implementation = null;
    return this;
  }

  getCallCount(): number {
    return this.callCount;
  }

  getCalls(): Array<{ url: string; options: RequestInit }> {
    return this.calls;
  }

  getLastCall(): { url: string; options: RequestInit } | undefined {
    return this.calls[this.calls.length - 1];
  }

  toHaveBeenCalled(): boolean {
    return this.callCount > 0;
  }

  toHaveBeenCalledWith(url: string | RegExp, options?: any): boolean {
    return this.calls.some((call) => {
      const urlMatch = url instanceof RegExp ? url.test(call.url) : call.url === url;
      const optionsMatch = options
        ? Object.entries(options).every(
            ([key, value]) =>
              JSON.stringify((call.options as any)[key]) === JSON.stringify(value)
          )
        : true;
      return urlMatch && optionsMatch;
    });
  }
}

// Create and export a singleton mock instance
export const mockFetch = new MockFetch();

// Set up global mock
mockFetch.mock();

// Also make it available as a vitest mock
export default mockFetch;
