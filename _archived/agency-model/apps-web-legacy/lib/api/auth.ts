/**
 * Authentication API
 *
 * Handles login, logout, registration, and user management.
 */

import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

/**
 * Authentication API methods
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Login via Next.js API route which sets the httpOnly cookie server-side
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }

    return res.json();
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/api/auth/register', data);
  },

  /**
   * Logout (clear auth token)
   */
  async logout(): Promise<void> {
    // Call backend logout
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore errors — proceed to clear cookie
    }
    // Clear the httpOnly cookie via server-side API route
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiClient.get<User>('/api/auth/me');
    } catch (_error) {
      // Not authenticated
      return null;
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/api/auth/me', data);
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiClient.post('/api/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/api/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },
};
