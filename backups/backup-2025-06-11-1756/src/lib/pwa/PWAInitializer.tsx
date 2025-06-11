'use client';

import { useEffect } from 'react';

export default function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed: ', error);
        });
    }

    // Handle PWA install prompt
    let deferredPrompt: any = null;

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      
      // Update UI notify the user they can install the PWA
      showInstallPromotion();
    };

    const handleAppInstalled = () => {
      // Hide the app-provided install promotion
      hideInstallPromotion();
      // Clear the deferredPrompt so it can be garbage collected
      deferredPrompt = null;
      // Optionally, send analytics event to indicate successful install
      console.log('PWA was installed');
    };

    // Listen for the install prompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstallPromotion = () => {
    // You can implement UI to show install promotion here
    // For example, show a banner or button to install the app
    console.log('App can be installed');
  };

  const hideInstallPromotion = () => {
    // Hide the install promotion UI
    console.log('Install promotion hidden');
  };

  return null; // This component doesn't render anything visible
}
