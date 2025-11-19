/**
 * API Service Layer - Phase 1
 * Centralized API communication with error handling and retries
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Generic GET request
 */
export async function apiGet<T = any>(url: string): Promise<APIResponse<T>> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        statusCode: res.status,
      };
    }

    const data = await res.json();

    return {
      success: true,
      data,
      statusCode: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generic POST request
 */
export async function apiPost<T = any>(
  url: string,
  body: any
): Promise<APIResponse<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        statusCode: res.status,
      };
    }

    const data = await res.json();

    return {
      success: true,
      data,
      statusCode: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generic PUT request
 */
export async function apiPut<T = any>(
  url: string,
  body: any
): Promise<APIResponse<T>> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        statusCode: res.status,
      };
    }

    const data = await res.json();

    return {
      success: true,
      data,
      statusCode: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generic DELETE request
 */
export async function apiDelete<T = any>(url: string): Promise<APIResponse<T>> {
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        statusCode: res.status,
      };
    }

    const data = await res.json();

    return {
      success: true,
      data,
      statusCode: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
