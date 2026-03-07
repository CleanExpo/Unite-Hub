'use client';
import { useState, useEffect } from 'react';

export function SyncStatusBadge({ workspaceId }: { workspaceId: string }) {
  const [status, setStatus] = useState<{ vault_path?: string; last_synced_at?: string; sync_enabled?: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/kanban/sync?workspace_id=${workspaceId}`)
      .then(r => r.json()).then(setStatus).catch(() => {});
  }, [workspaceId]);

  if (!status?.vault_path) return (
    <span className="text-xs font-mono text-white/20">No vault configured</span>
  );

  return (
    <span className="text-xs font-mono text-white/40">
      {status.sync_enabled ? '⚡' : '○'} {status.last_synced_at
        ? `Synced ${new Date(status.last_synced_at).toLocaleTimeString('en-AU')}`
        : 'Not synced'}
    </span>
  );
}
