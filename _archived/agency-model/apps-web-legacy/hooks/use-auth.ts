'use client';

import { useEffect, useState } from 'react';
import { authApi, type User } from '@/lib/api/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    getUser();
  }, []);

  return { user, loading };
}
