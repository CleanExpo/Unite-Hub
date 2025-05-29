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
    
    // Then check if the user has already consented
    const checkConsent = async () => {
      try {
        const response = await fetch(`/api/compliance/cookie-consent?sessionId=${newSessionId}`);
        const data = await response.json();
        
        if (data.exists) {
          // User has already provided consent
          setHasConsented(true);
          setPreferences(data.consent);
          setShowBanner(false);
        } else {
          // User hasn't consented yet, show the banner
          setShowBanner(true);
        }
      } catch (error) {
        console.error('Error checking cookie consent:', error);
        // If there's an error, default to showing the banner
        setShowBanner(true);
      }
    };
    
    checkConsent();
  }, []);
  
  // Save consent preferences to the server
  const saveConsent = async (newPreferences: CookieConsentFormData) => {
    try {
      const response = await fetch('/api/compliance/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          preferences: newPreferences
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save cookie preferences');
      }
      
      // Update local state
      setPreferences(newPreferences);
      setHasConsented(true);
      setShowBanner(false);
      setIsModalOpen(false);
      
      // If analytics cookies are accepted, initialize analytics
      if (newPreferences.analytics) {
        initializeAnalytics();
      }
      
      // If marketing cookies are accepted, initialize marketing tools
      if (newPreferences.marketing) {
        initializeMarketingTools();
      }
      
      // No return value needed, function returns void
    } catch (error) {
      console.error('Error saving cookie consent:', error);
      throw error;
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
  const handleReject = () => {
    setShowBanner(false);
    // We don't save this to the server as we don't want to track users who rejected cookies
    // But we do need to set hasConsented to true to prevent the banner from showing again
    setHasConsented(true);
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
