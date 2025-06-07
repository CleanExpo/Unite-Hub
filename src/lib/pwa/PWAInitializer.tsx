"use client";

import { useEffect } from 'react';
import { registerServiceWorker, setupPeriodicSWUpdates } from './registerSW';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

/**
 * PWAInitializer component
 * This component handles the registration of the service worker and sets up periodic updates
 * It should be imported and used in the root layout to ensure it's loaded on all pages
 */
export default function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Set up periodic updates
    setupPeriodicSWUpdates();
    
    // Log that PWA initialization is complete
    console.log('PWA functionality initialized');
  }, []);

  // Render PWA UI components
  return (
    <>
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
}
