/**
 * useOrganizations Hook - SWR-based org fetching with deduplication
 * Prevents duplicate API calls across components
 */

import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  [key: string]: unknown;
}

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return res.json();
};

export function useOrganizations() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? [`/api/organizations?userId=${user.id}`, user] : null,
    ([url]) => {
      // Get token from localStorage
      const authToken = localStorage.getItem('sb-lksfwktwtmyznckodsau-auth-token');
      if (!authToken) {
throw new Error('No auth token');
}

      const parsed = JSON.parse(authToken);
      return fetcher(url, parsed.access_token);
    },
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
    }
  );

  return {
    organizations: data as Organization[] | null,
    isLoading,
    isError: error,
    mutate,
  };
}
