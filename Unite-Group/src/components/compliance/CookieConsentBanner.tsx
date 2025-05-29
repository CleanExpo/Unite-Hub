"use client";

import { useState, useEffect } from 'react';
import { CookieConsentFormData } from '@/lib/compliance/types';
import { nanoid } from 'nanoid';

interface CookieConsentBannerProps {
  onAccept: (consent: CookieConsentFormData) => Promise<void>;
  onReject: () => void;
  onShowPreferences: () => void;
  className?: string;
}

/**
 * Cookie consent banner that displays when a user first visits the site
 * Complies with GDPR/CCPA requirements for obtaining explicit consent
 */
export default function CookieConsentBanner({
  onAccept,
  onReject,
  onShowPreferences,
  className = ''
}: CookieConsentBannerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Generate a session ID if one doesn't exist
  useEffect(() => {
    const existingSessionId = localStorage.getItem('sessionId');
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = nanoid();
      localStorage.setItem('sessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const handleAcceptAll = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const consent: CookieConsentFormData = {
        preferences: true,
        analytics: true,
        marketing: true
      };
      
      await onAccept(consent);
    } catch (err: any) {
      console.error('Error accepting cookies:', err);
      setError(err.message || 'Failed to save cookie preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptNecessary = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const consent: CookieConsentFormData = {
        preferences: false,
        analytics: false,
        marketing: false
      };
      
      await onAccept(consent);
    } catch (err: any) {
      console.error('Error accepting necessary cookies:', err);
      setError(err.message || 'Failed to save cookie preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0 md:pr-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cookie Consent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies. Necessary cookies are required for the website to function properly.
            </p>
            
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
            <button
              type="button"
              onClick={onShowPreferences}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              Preferences
            </button>
            
            <button
              type="button"
              onClick={handleAcceptNecessary}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              Necessary Only
            </button>
            
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
