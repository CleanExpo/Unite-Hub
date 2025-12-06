'use client';

/**
 * Hook to get the current Synthex tenant ID
 * Reads from localStorage and provides tenant context
 */

import { useState, useEffect } from 'react';

interface UseSynthexTenantResult {
  tenantId: string | null;
  loading: boolean;
  setTenantId: (id: string) => void;
}

const STORAGE_KEY = 'synthex_tenant_id';

export function useSynthexTenant(): UseSynthexTenantResult {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTenantIdState(stored);
    }
    setLoading(false);
  }, []);

  const setTenantId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setTenantIdState(id);
  };

  return {
    tenantId,
    loading,
    setTenantId,
  };
}

export default useSynthexTenant;
