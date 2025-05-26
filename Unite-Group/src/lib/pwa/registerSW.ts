/**
 * Service Worker Registration Utility
 * Handles registration and updates of the service worker
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';
      
      // Check if this is a production environment
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        registerValidSW(swUrl);
      } else {
        // In development, don't register the service worker to avoid caching issues
        console.log('Service Worker not registered in development mode.');
      }
    });
  } else {
    console.log('Service Workers are not supported in this browser.');
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      
      // Set up update handling
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('New content is available and will be used when all tabs for this page are closed.');
              
              // Notify the user about the update
              notifyUserAboutUpdate();
            } else {
              // At this point, everything has been precached.
              console.log('Content is cached for offline use.');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

/**
 * Check for service worker updates
 * Call this function periodically to check for updates
 */
export function checkForServiceWorkerUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        // Check for updates
        registration.update()
          .then(() => {
            console.log('Service Worker update check complete');
          })
          .catch((error) => {
            console.error('Error checking for Service Worker updates:', error);
          });
      })
      .catch((error) => {
        console.error('Error accessing Service Worker registration:', error);
      });
  }
}

/**
 * Function to notify the user about service worker updates
 */
function notifyUserAboutUpdate() {
  // This function can be customized to show a toast notification,
  // a modal, or other UI elements to inform the user about the update
  
  // For now, we'll just create a simple UI element
  const updateNotification = document.createElement('div');
  updateNotification.className = 'update-notification';
  updateNotification.innerHTML = `
    <div class="update-notification-content">
      <p>A new version of this site is available.</p>
      <button id="update-refresh-button">Refresh</button>
      <button id="update-dismiss-button">Dismiss</button>
    </div>
  `;
  
  // Add styles
  updateNotification.style.position = 'fixed';
  updateNotification.style.bottom = '20px';
  updateNotification.style.right = '20px';
  updateNotification.style.backgroundColor = '#0f172a';
  updateNotification.style.color = 'white';
  updateNotification.style.padding = '15px';
  updateNotification.style.borderRadius = '8px';
  updateNotification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  updateNotification.style.zIndex = '9999';
  updateNotification.style.border = '1px solid #334155';
  
  // Add to the document
  document.body.appendChild(updateNotification);
  
  // Set up event listeners
  const refreshButton = document.getElementById('update-refresh-button');
  const dismissButton = document.getElementById('update-dismiss-button');
  
  if (refreshButton) {
    refreshButton.style.backgroundColor = '#14b8a6';
    refreshButton.style.color = 'white';
    refreshButton.style.padding = '8px 16px';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '4px';
    refreshButton.style.marginRight = '8px';
    refreshButton.style.cursor = 'pointer';
    
    refreshButton.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  if (dismissButton) {
    dismissButton.style.backgroundColor = 'transparent';
    dismissButton.style.color = '#94a3b8';
    dismissButton.style.padding = '8px 16px';
    dismissButton.style.border = '1px solid #475569';
    dismissButton.style.borderRadius = '4px';
    dismissButton.style.cursor = 'pointer';
    
    dismissButton.addEventListener('click', () => {
      document.body.removeChild(updateNotification);
    });
  }
}

/**
 * Setup periodic service worker update checks
 * Call this function once in your application to set up regular checks
 */
export function setupPeriodicSWUpdates() {
  // Check for updates every hour
  const ONE_HOUR_MS = 60 * 60 * 1000;
  
  // Initial check after 5 minutes
  setTimeout(() => {
    checkForServiceWorkerUpdates();
    
    // Then check every hour
    setInterval(checkForServiceWorkerUpdates, ONE_HOUR_MS);
  }, 5 * 60 * 1000);
}

/**
 * Force an immediate refresh to update the service worker
 */
export function forceServiceWorkerUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update().then(() => {
        window.location.reload();
      });
    });
  } else {
    // If service workers aren't supported, just reload the page
    window.location.reload();
  }
}

/**
 * Register for push notifications
 * @returns Promise that resolves to the push subscription
 */
export async function registerForPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing permissions
    const permissionResult = await Notification.requestPermission();
    if (permissionResult !== 'granted') {
      throw new Error('Permission for notifications was denied.');
    }
    
    // Subscribe to push notifications
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ),
    };
    
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    
    // Send the subscription to your server
    await saveSubscription(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    throw error;
  }
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Save push subscription to server
 */
async function saveSubscription(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save push subscription on server.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}
