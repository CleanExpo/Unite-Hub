'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function ClientLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/client-logout', {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/client/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-400 hover:text-gray-100 transition-colors"
      aria-label="Logout"
      title="Logout"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
