/**
 * useGuardianRealtime Hook
 * Subscribes to live Guardian alert events via Supabase Realtime
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GuardianRealtimeData {
  alerts: number;
  incidents: number;
  notifications: number;
  lastUpdate: Date | null;
}

export function useGuardianRealtime(tenantId: string | null) {
  const [stats, setStats] = useState<GuardianRealtimeData>({
    alerts: 0,
    incidents: 0,
    notifications: 0,
    lastUpdate: null,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel;

    const subscribe = async () => {
      // Subscribe to guardian_alert_events
      channel = supabase
        .channel(`guardian-realtime-${tenantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'guardian_alert_events',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            console.log('[Guardian Realtime] New alert:', payload);
            setStats((prev) => ({
              ...prev,
              alerts: prev.alerts + 1,
              lastUpdate: new Date(),
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'incidents',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            console.log('[Guardian Realtime] New incident:', payload);
            setStats((prev) => ({
              ...prev,
              incidents: prev.incidents + 1,
              lastUpdate: new Date(),
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'guardian_notifications',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            console.log('[Guardian Realtime] New notification:', payload);
            setStats((prev) => ({
              ...prev,
              notifications: prev.notifications + 1,
              lastUpdate: new Date(),
            }));
          }
        )
        .subscribe((status) => {
          console.log('[Guardian Realtime] Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    subscribe();

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [tenantId]);

  return {
    stats,
    isConnected,
  };
}
