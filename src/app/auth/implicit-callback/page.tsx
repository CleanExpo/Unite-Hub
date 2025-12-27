"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export default function ImplicitCallbackPage() {
  const [status, setStatus] = useState<string>("Processing authentication...");

  useEffect(() => {
    const handleImplicitFlow = async () => {
      try {
        // The Supabase client with detectSessionInUrl: true will automatically
        // extract tokens from the URL hash and store them in localStorage
        setStatus("Extracting session from URL...");

        // Give Supabase time to process the URL hash and store the session
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify the session was stored successfully
        const { data: { session }, error } = await supabaseBrowser.auth.getSession();

        if (error) {
          console.error('Implicit flow error:', error);
          setStatus('Authentication failed: ' + error.message);
          setTimeout(() => {
            window.location.href = '/login?error=implicit_flow_failed';
          }, 2000);
          return;
        }

        if (session) {
          console.log('Session successfully created and persisted for:', session.user.email);
          console.log('Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());

          // Verify session is in localStorage
          const storedSession = localStorage.getItem(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);
          if (storedSession) {
            console.log('Session confirmed in localStorage');
          }

          setStatus('Success! Checking setup status...');

          // Check if user needs onboarding
          const { data: onboardingProgress } = await supabaseBrowser
            .from('user_onboarding_progress')
            .select('wizard_completed, wizard_skipped')
            .eq('user_id', session.user.id)
            .maybeSingle();

          // Wait a moment to show success message
          await new Promise(resolve => setTimeout(resolve, 500));

          // Route based on onboarding status
          if (!onboardingProgress || (!onboardingProgress.wizard_completed && !onboardingProgress.wizard_skipped)) {
            // New user → Onboarding wizard
            window.location.href = '/onboarding';
          } else {
            // Returning user → Dashboard
            window.location.href = '/dashboard/overview';
          }
        } else {
          console.error('No session created after implicit flow');
          setStatus('No session created');
          setTimeout(() => {
            window.location.href = '/login?error=no_session';
          }, 2000);
        }
      } catch (err) {
        console.error('Unexpected error in implicit flow:', err);
        setStatus('Unexpected error occurred');
        setTimeout(() => {
          window.location.href = '/login?error=unexpected_error';
        }, 2000);
      }
    };

    handleImplicitFlow();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-raised">
      <div className="text-center max-w-md px-6">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-6"></div>
        <p className="text-lg text-text-secondary">{status}</p>
      </div>
    </div>
  );
}
