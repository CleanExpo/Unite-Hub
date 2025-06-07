"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { nanoid } from 'nanoid';

import CookieConsentBanner from './CookieConsentBanner';
import CookiePreferencesModal from './CookiePreferencesModal';
import { CookieConsentFormData } from '@/lib/compliance/types';

interface CookieConsentContextType {
  hasConsented: boolean;
  preferences: CookieConsentFormData;
  showPreferencesModal: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  hasConsented: false,
  preferences: {
    preferences: false,
    analytics: false,
    marketing: false
  },
  showPreferencesModal: () => {}
});

export const useCookieConsent = () => useContext(CookieConsentContext);

interface CookieConsentProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages cookie consent state across the application
 * Displays the cookie consent banner if the user hasn't consented yet
 * Provides access to cookie preferences and a way to show the preferences modal
 */
export default function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  // State for tracking consent status and preferences
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [preferences, setPreferences] = useState<CookieConsentFormData>({
    preferences: false,
    analytics: false,
    marketing: false
  });
  
  // Initialize on component mount
  useEffect(() => {
    // First, ensure we have a session ID
    const storedSessionId = localStorage.getItem('sessionId');
    const newSessionId = storedSessionId || nanoid();
    
    if (!storedSessionId) {
      localStorage.setItem('sessionId', newSessionId);
    }
    
    setSessionId(newSessionId);
    
    // Check local storage first to prevent blocking
    const localConsent = localStorage.getItem('cookieConsent');
    if (localConsent) {
      try {
        const parsed = JSON.parse(localConsent);
        if (parsed.hasConsented) {
          setHasConsented(true);
          setPreferences(parsed.preferences || {
            preferences: false,
            analytics: false,
            marketing: false
          });
          setShowBanner(false);
          return;
        }
      } catch (parseError) {
        console.error('Error parsing local consent:', parseError);
      }
    }
    
    // Then check if the user has already consented via API (non-blocking)
    const checkConsent = async () => {
      try {
        // Set a timeout for the API call to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`/api/compliance/cookie-consent?sessionId=${newSessionId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.exists) {
            // User has already provided consent
            setHasConsented(true);
            setPreferences(data.consent);
            setShowBanner(false);
            
            // Save to localStorage as backup
            localStorage.setItem('cookieConsent', JSON.stringify({
              hasConsented: true,
              preferences: data.consent,
              timestamp: Date.now()
            }));
            return;
          }
        }
      } catch (error) {
        console.warn('Cookie consent API check failed, using local storage fallback:', error);
      }
      
      // Show banner only if no consent found anywhere
      // Add a small delay to prevent flash of banner on fast connections
      setTimeout(() => {
        setShowBanner(true);
      }, 500);
    };
    
    checkConsent();
  }, []);
  
  // Save consent preferences to the server
  const saveConsent = async (newPreferences: CookieConsentFormData) => {
    // Always update local state and save to localStorage first
    setPreferences(newPreferences);
    setHasConsented(true);
    setShowBanner(false);
    setIsModalOpen(false);

    // Save to localStorage immediately
    localStorage.setItem('cookieConsent', JSON.stringify({
      hasConsented: true,
      preferences: newPreferences,
      timestamp: Date.now()
    }));

    // Initialize services based on preferences
    if (newPreferences.analytics) {
      initializeAnalytics();
    }

    if (newPreferences.marketing) {
      initializeMarketingTools();
    }

    // Try to save to server (non-blocking)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/compliance/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          preferences: newPreferences
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to save cookie preferences to server: ${response.status}`);
      }
    } catch (error) {
      console.warn('Error saving cookie consent to server (will use local storage):', error);
    }
  };
  
  // Initialize analytics tools if analytics cookies are accepted
  const initializeAnalytics = () => {
    // This would be where you initialize Google Analytics, Matomo, etc.
    console.log('Analytics initialized');
  };
  
  // Initialize marketing tools if marketing cookies are accepted
  const initializeMarketingTools = () => {
    // This would be where you initialize marketing pixels, tracking, etc.
    console.log('Marketing tools initialized');
  };
  
  // Handle accepting all cookies
  const handleAcceptAll = async (newPreferences: CookieConsentFormData) => {
    await saveConsent(newPreferences);
  };
  
  // Handle rejecting non-essential cookies
  const handleReject = async () => {
    const consent: CookieConsentFormData = {
      preferences: false,
      analytics: false,
      marketing: false
    };
    await saveConsent(consent);
  };
  
  // Show the preferences modal
  const showPreferencesModal = () => {
    setIsModalOpen(true);
  };
  
  // Context value to expose to consumers
  const contextValue: CookieConsentContextType = {
    hasConsented,
    preferences,
    showPreferencesModal
  };
  
  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      
      {/* Cookie consent banner */}
      {showBanner && (
        <CookieConsentBanner
          onAccept={handleAcceptAll}
          onReject={handleReject}
          onShowPreferences={showPreferencesModal}
        />
      )}
      
      {/* Cookie preferences modal */}
      <CookiePreferencesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveConsent}
        initialPreferences={preferences}
      />
    </CookieConsentContext.Provider>
  );
}

// Button component for managing cookie preferences
export function CookiePreferencesButton({ className = '' }: { className?: string }) {
  const { showPreferencesModal } = useCookieConsent();
  
  return (
    <button
      type="button"
      onClick={showPreferencesModal}
      className={`text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 ${className}`}
    >
      Cookie Preferences
    </button>
  );
}
