"use client";

import { useEffect } from 'react';
import { registerServiceWorker, setupPeriodicSWUpdates } from './registerSW';

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

  // This component doesn't render anything visible
  return null;
}
