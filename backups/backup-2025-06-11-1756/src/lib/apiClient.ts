// Unified API client for frontend-backend communication
export const apiClient = {
  async getAuthHeaders() {
    // Get auth token from Supabase client (if using in browser)
    if (typeof window !== 'undefined') {
      const { supabaseClient } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`
        };
      }
    }
    return {};
  },

  async get(endpoint: string) {
    const authHeaders = await this.getAuthHeaders();
    const response = await fetch(`/api/${endpoint}`, {
      headers: authHeaders
    });
    return this.handleResponse(response);
  },

  async post<T>(endpoint: string, data: T) {
    const authHeaders = await this.getAuthHeaders();
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  },

  async put<T>(endpoint: string, data: T) {
    const authHeaders = await this.getAuthHeaders();
    const response = await fetch(`/api/${endpoint}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  },

  async delete(endpoint: string) {
    const authHeaders = await this.getAuthHeaders();
    const response = await fetch(`/api/${endpoint}`, { 
      method: 'DELETE',
      headers: authHeaders
    });
    return this.handleResponse(response);
  },

  async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // CRM-specific methods
  crm: {
    async getDashboardStats() {
      return apiClient.get('crm/dashboard');
    },
    
    async getTeamMembers() {
      return apiClient.get('crm/team');
    },
    
    async updatePermissions(userId: string, permissions: Record<string, boolean>) {
      return apiClient.put(`crm/team/${userId}/permissions`, permissions);
    }
  }
};
