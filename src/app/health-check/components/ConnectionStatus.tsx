/**
 * Connection Status Component
 * WebSocket connection indicator for real-time threat monitoring
 *
 * Features:
 * - Green pulsing dot when connected
 * - Red when disconnected
 * - Auto-reconnect status text
 */

'use client';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2.5 w-2.5 rounded-full animate-pulse ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-text-secondary">
        {isConnected ? 'Live' : 'Reconnecting...'}
      </span>
    </div>
  );
}
