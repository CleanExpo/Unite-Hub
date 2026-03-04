'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';

export function PushNotificationToggle() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'enabled' | 'disabled'>('loading');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported'); return;
    }
    if (Notification.permission === 'denied') { setStatus('denied'); return; }
    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? 'enabled' : 'disabled');
    }).catch(() => setStatus('disabled'));
  }, []);

  async function handleEnable() {
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }

      // Get VAPID public key
      const keyRes = await fetch('/api/founder/push/vapid-public-key');
      const { publicKey } = await keyRes.json();
      if (!publicKey) { console.warn('VAPID not configured'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch('/api/founder/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64(sub.getKey('auth')!),
          },
          userAgent: navigator.userAgent,
        }),
      });
      setStatus('enabled');
    } catch (err) {
      console.error('Push subscribe error:', err);
    } finally { setWorking(false); }
  }

  async function handleDisable() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/founder/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('disabled');
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    } finally { setWorking(false); }
  }

  if (status === 'unsupported') return null;

  return (
    <button
      onClick={status === 'enabled' ? handleDisable : handleEnable}
      disabled={working || status === 'denied' || status === 'loading'}
      className={[
        'flex items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors',
        status === 'enabled'
          ? 'border-[#00FF88]/30 bg-[#00FF88]/5 text-[#00FF88] hover:bg-[#00FF88]/10'
          : status === 'denied'
          ? 'border-[#FF4444]/20 bg-[#FF4444]/5 text-[#FF4444] cursor-not-allowed'
          : 'border-white/10 bg-white/5 text-white/50 hover:text-white',
      ].join(' ')}
      title={status === 'denied' ? 'Notifications blocked — enable in browser settings' : undefined}
    >
      {working ? <Loader2 className="h-3 w-3 animate-spin" /> :
       status === 'enabled' ? <BellRing className="h-3 w-3" /> :
       status === 'denied' ? <BellOff className="h-3 w-3" /> :
       <Bell className="h-3 w-3" />}
      {status === 'enabled' ? 'Notifications On' :
       status === 'denied' ? 'Blocked' :
       status === 'loading' ? '...' :
       'Enable Notifications'}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
