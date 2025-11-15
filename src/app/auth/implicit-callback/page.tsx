"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export default function ImplicitCallbackPage() {
  useEffect(() => {
    const handleImplicitFlow = async () => {
      // Supabase client automatically detects tokens in URL hash
      // Wait a moment for Supabase to process the hash
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if we have a session after Supabase processes the hash
      const { data: { session }, error } = await supabaseBrowser.auth.getSession();

      if (error) {
        console.error('Implicit flow error:', error);
        window.location.href = '/login?error=implicit_flow_failed';
        return;
      }

      if (session) {
        console.log('Implicit flow session created for:', session.user.email);
        // Session is set - redirect to dashboard using window.location for hard navigation
        window.location.href = '/dashboard/overview';
      } else {
        console.error('No session after implicit flow');
        window.location.href = '/login?error=no_session';
      }
    };

    handleImplicitFlow();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
