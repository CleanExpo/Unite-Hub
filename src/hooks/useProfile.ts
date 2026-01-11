/**
 * useProfile Hook - SWR-based profile fetching with deduplication
 * Prevents duplicate API calls across components
 */

import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  [key: string]: unknown;
}

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }

  return res.json();
};

export function useProfile() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? [`/api/profile?userId=${user.id}`, user] : null,
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
      dedupingInterval: 5000,      // Dedupe requests within 5s
      revalidateOnFocus: false,     // Don't refetch on tab focus
      revalidateOnReconnect: true,  // Refetch on reconnect
      refreshInterval: 60000,       // Refresh every 60s
    }
  );

  return {
    profile: data as UserProfile | null,
    isLoading,
    isError: error,
    mutate,  // For manual revalidation
  };
}
