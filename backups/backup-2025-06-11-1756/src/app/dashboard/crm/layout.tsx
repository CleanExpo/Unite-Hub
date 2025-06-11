import React from 'react';
import Sidebar from '@/components/crm/Sidebar';
import { createClient } from '@/lib/supabase/server';

interface CRMLayoutProps {
  children: React.ReactNode;
}

export default async function CRMLayout({ children }: CRMLayoutProps) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Check if user is admin
  let isAdmin = false;
  if (user && !error) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    isAdmin = profile?.role === 'admin';
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
