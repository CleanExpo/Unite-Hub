'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CRMPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
