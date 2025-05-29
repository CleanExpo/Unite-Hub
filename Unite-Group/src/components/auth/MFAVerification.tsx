"use client";

import { useState, useEffect, useCallback } from 'react';
import { validateTOTP } from '@/lib/auth/mfa/totp';

interface MFAVerificationProps {
  userSecret: string; // The user's TOTP secret stored in the database
  onVerificationComplete: () => Promise<void>;
  onCancel: () => void;
}

export default function MFAVerification({
  userSecret,
  onVerificationComplete,
  onCancel
}: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Calculate and update the remaining time for the current TOTP period
  useEffect(() => {
    const updateRemainingTime = () => {
      const period = 30; // seconds
      const currentTime = Math.floor(Date.now() / 1000);
      const timeElapsed = currentTime % period;
      const timeRemaining = period - timeElapsed;
      setRemainingTime(timeRemaining);
    };

    // Update immediately
    updateRemainingTime();
    
    // Update every second
    const intervalId = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!verificationCode) {
      setError('Please enter the verification code from your authenticator app');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = validateTOTP(verificationCode, userSecret);
      
      if (isValid) {
        await onVerificationComplete();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
      console.error('MFA verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, userSecret, onVerificationComplete]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [handleVerify, verificationCode, isVerifying]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      
      <div className="mb-6">
        <p className="mb-4">
          Enter the 6-digit code from your authenticator app to complete sign-in:
        </p>
        
        <div className="mt-4">
          <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Verification Code
          </label>
          <div className="mt-1 relative">
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                // Only allow digits and limit to 6 characters
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setVerificationCode(value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              maxLength={6}
              placeholder="Enter 6-digit code"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-center text-xl tracking-wider"
              autoFocus
            />
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
              <div className="h-8 w-8 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    className="dark:stroke-gray-600"
                  />
                  <path
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeDasharray={`${100 - (remainingTime / 30) * 100}, 100`}
                    className="dark:stroke-indigo-400"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            Code refreshes in {remainingTime} seconds
          </div>
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Login
        </button>
        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || verificationCode.length !== 6}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isVerifying || verificationCode.length !== 6
              ? 'bg-indigo-400 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Try another sign-in method
        </button>
      </div>
    </div>
  );
}
