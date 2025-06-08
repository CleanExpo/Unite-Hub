'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/client';
import MFASetup from '../../../../components/auth/MFASetup';

interface SecurityState {
  loading: boolean;
  mfaEnabled: boolean;
  showMfaSetup: boolean;
  backupCodes: string[] | null;
  showBackupCodes: boolean;
  error: string | null;
}

export default function SecurityPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<SecurityState>({
    loading: true,
    mfaEnabled: false,
    showMfaSetup: false,
    backupCodes: null,
    showBackupCodes: false,
    error: null
  });

  // Fetch user session and MFA status
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setSession(session);
        
        // Get the user's MFA status
        const { data, error } = await supabaseClient
          .from('users')
          .select('mfa_enabled')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setState(prevState => ({
          ...prevState,
          loading: false,
          mfaEnabled: data?.mfa_enabled || false
        }));
      } catch (error: any) {
        console.error('Failed to fetch user data:', error);
        setState(prevState => ({
          ...prevState,
          loading: false,
          error: 'Failed to load security settings. Please try again.'
        }));
      }
    };
    
    fetchUserData();
  }, [router]);

  const handleEnableMFA = () => {
    setState(prevState => ({ ...prevState, showMfaSetup: true }));
  };

  const handleDisableMFA = async () => {
    try {
      setState(prevState => ({ ...prevState, loading: true }));
      
      const response = await fetch('/api/auth/mfa', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable MFA');
      }
      
      setState(prevState => ({
        ...prevState,
        loading: false,
        mfaEnabled: false,
        error: null
      }));
    } catch (error: any) {
      console.error('Failed to disable MFA:', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message || 'Failed to disable MFA'
      }));
    }
  };

  const handleMFASetupComplete = async (secret: string) => {
    try {
      setState(prevState => ({ ...prevState, loading: true }));
      
      // Generate backup codes after MFA is enabled
      const response = await fetch('/api/auth/mfa/backup-codes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate backup codes');
      }
      
      const data = await response.json();
      
      setState(prevState => ({
        ...prevState,
        loading: false,
        mfaEnabled: true,
        showMfaSetup: false,
        backupCodes: data.backupCodes,
        showBackupCodes: true,
        error: null
      }));
    } catch (error: any) {
      console.error('Failed to complete MFA setup:', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message || 'Failed to complete MFA setup'
      }));
    }
  };

  const handleMFASetupCancel = () => {
    setState(prevState => ({
      ...prevState,
      showMfaSetup: false
    }));
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setState(prevState => ({ ...prevState, loading: true }));
      
      const response = await fetch('/api/auth/mfa/backup-codes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }
      
      const data = await response.json();
      
      setState(prevState => ({
        ...prevState,
        loading: false,
        backupCodes: data.backupCodes,
        showBackupCodes: true,
        error: null
      }));
    } catch (error: any) {
      console.error('Failed to regenerate backup codes:', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message || 'Failed to regenerate backup codes'
      }));
    }
  };

  const handleCloseBackupCodes = () => {
    setState(prevState => ({
      ...prevState,
      showBackupCodes: false,
      backupCodes: null
    }));
  };

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Account Security</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Account Security</h1>
      
      {state.error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{state.error}</span>
        </div>
      )}
      
      {state.showMfaSetup ? (
        <MFASetup 
          userId={session?.user.id || ''}
          userEmail={session?.user.email || ''}
          onSetupComplete={handleMFASetupComplete}
          onCancel={handleMFASetupCancel}
        />
      ) : state.showBackupCodes ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Backup Codes</h2>
          <p className="mb-4">
            Store these backup codes in a secure location. Each code can only be used once to sign in if you don't have access to your authenticator app.
          </p>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            {state.backupCodes?.map((code, index) => (
              <div key={index} className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                {code}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCloseBackupCodes}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication (2FA)</h2>
            <p className="mb-4">
              Add an extra layer of security to your account by requiring both your password and a verification code from your mobile device.
            </p>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">
                  {state.mfaEnabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {state.mfaEnabled 
                    ? 'Your account is protected with two-factor authentication.' 
                    : 'Enable two-factor authentication to increase your account security.'}
                </p>
              </div>
              <button
                type="button"
                onClick={state.mfaEnabled ? handleDisableMFA : handleEnableMFA}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  state.mfaEnabled 
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
              >
                {state.mfaEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
          
          {state.mfaEnabled && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Backup Codes</h2>
              <p className="mb-4">
                Backup codes can be used to access your account if you cannot receive two-factor authentication codes.
              </p>
              
              <button
                type="button"
                onClick={handleRegenerateBackupCodes}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Generate New Backup Codes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
