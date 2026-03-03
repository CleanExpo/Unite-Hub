/**
 * Contractor API Client
 *
 * Connects Next.js frontend to FastAPI backend.
 * Handles Australian context (AEST timezone, DD/MM/YYYY dates).
 */

import type {
  Contractor,
  ContractorCreate,
  ContractorUpdate,
  ContractorListResponse,
  AvailabilitySlot,
  AvailabilitySlotCreate,
  AvailabilityStatus,
  AustralianState,
  ErrorResponse,
} from "@/types/contractor";

// Backend API URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Handle API errors with proper typing
 */
class ContractorAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: ErrorResponse
  ) {
    super(message);
    this.name = "ContractorAPIError";
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // Handle 204 No Content (DELETE success)
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ContractorAPIError(
        `API request failed: ${response.statusText}`,
        response.status,
        data as ErrorResponse
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ContractorAPIError) {
      throw error;
    }
    throw new ContractorAPIError(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      0
    );
  }
}

/**
 * Contractor API Client
 */
export const contractorAPI = {
  /**
   * List all contractors with pagination and filtering
   */
  async list(params?: {
    page?: number;
    pageSize?: number;
    state?: AustralianState;
    specialisation?: string;
  }): Promise<ContractorListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.pageSize) queryParams.set("page_size", params.pageSize.toString());
    if (params?.state) queryParams.set("state", params.state);
    if (params?.specialisation) queryParams.set("specialisation", params.specialisation);

    const endpoint = `/api/contractors/?${queryParams.toString()}`;
    return apiFetch<ContractorListResponse>(endpoint);
  },

  /**
   * Get contractor by ID with availability slots
   */
  async get(contractorId: string): Promise<Contractor> {
    return apiFetch<Contractor>(`/api/contractors/${contractorId}`);
  },

  /**
   * Create new contractor
   */
  async create(data: ContractorCreate): Promise<Contractor> {
    return apiFetch<Contractor>("/api/contractors/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update contractor details (partial update)
   */
  async update(contractorId: string, data: ContractorUpdate): Promise<Contractor> {
    return apiFetch<Contractor>(`/api/contractors/${contractorId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete contractor
   */
  async delete(contractorId: string): Promise<void> {
    return apiFetch<void>(`/api/contractors/${contractorId}`, {
      method: "DELETE",
    });
  },

  /**
   * Add availability slot for contractor
   */
  async addAvailability(
    contractorId: string,
    data: AvailabilitySlotCreate
  ): Promise<AvailabilitySlot> {
    return apiFetch<AvailabilitySlot>(
      `/api/contractors/${contractorId}/availability`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Get contractor's availability slots with optional status filter
   */
  async getAvailability(
    contractorId: string,
    status?: AvailabilityStatus
  ): Promise<AvailabilitySlot[]> {
    const queryParams = status ? `?status=${status}` : "";
    return apiFetch<AvailabilitySlot[]>(
      `/api/contractors/${contractorId}/availability${queryParams}`
    );
  },

  /**
   * Search contractors by Brisbane suburb
   */
  async searchByLocation(params: {
    suburb: string;
    state?: AustralianState;
    page?: number;
    pageSize?: number;
  }): Promise<ContractorListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.set("suburb", params.suburb);
    if (params.state) queryParams.set("state", params.state);
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.pageSize) queryParams.set("page_size", params.pageSize.toString());

    const endpoint = `/api/contractors/search/by-location?${queryParams.toString()}`;
    return apiFetch<ContractorListResponse>(endpoint);
  },
};

/**
 * React hook for contractor data fetching with loading/error states
 */
export function useContractor(contractorId: string) {
  const [contractor, setContractor] = React.useState<Contractor | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function fetchContractor() {
      try {
        setLoading(true);
        setError(null);
        const data = await contractorAPI.get(contractorId);
        if (mounted) {
          setContractor(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load contractor");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchContractor();

    return () => {
      mounted = false;
    };
  }, [contractorId]);

  return { contractor, loading, error };
}

// Add React import at top of file (will be used by hook)
import React from "react";
