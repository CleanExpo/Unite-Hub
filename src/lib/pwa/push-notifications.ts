// Push Notifications Service
import { supabase } from '@/lib/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Get current permission status
   */
  static getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribe(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to server
    await this.saveSubscription(subscription);

    return subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscription(subscription);
    }
  }

  /**
   * Get current subscription
   */
  static async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }

  /**
   * Save subscription to database
   */
  private static async saveSubscription(subscription: PushSubscription): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') as ArrayBuffer))),
      },
    };

    // Save to API endpoint
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscriptionData,
        userId: userData?.user?.id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
  }

  /**
   * Remove subscription from database
   */
  private static async removeSubscription(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
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
   * Send test notification (for development)
   */
  static async sendTestNotification(): Promise<void> {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }
  }
}

/**
 * React hook for push notifications
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported(PushNotificationService.isSupported());
      setPermission(PushNotificationService.getPermissionStatus());
      
      PushNotificationService.getSubscription().then(setSubscription);
    }
  }, []);

  const subscribe = React.useCallback(async () => {
    setLoading(true);
    try {
      const sub = await PushNotificationService.subscribe();
      setSubscription(sub);
      setPermission('granted');
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = React.useCallback(async () => {
    setLoading(true);
    try {
      await PushNotificationService.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    loading,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
  };
}

// Import React for the hook
import React from 'react';
