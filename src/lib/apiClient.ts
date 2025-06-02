// Unified API client for frontend-backend communication
export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`/api/${endpoint}`);
    return this.handleResponse(response);
  },

  async post<T>(endpoint: string, data: T) {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  },

  async put<T>(endpoint: string, data: T) {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`/api/${endpoint}`, { method: 'DELETE' });
    return this.handleResponse(response);
  },

  async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
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
