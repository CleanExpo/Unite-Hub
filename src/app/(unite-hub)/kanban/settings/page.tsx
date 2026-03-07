'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KanbanSettingsPage() {
  const [vaultPath, setVaultPath] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/kanban/sync?workspace_id=current')
      .then(r => r.json())
      .then((d: { vault_path?: string; sync_enabled?: boolean }) => {
        if (d?.vault_path) { setVaultPath(d.vault_path); setSyncEnabled(d.sync_enabled ?? true); }
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/kanban/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault_path: vaultPath, sync_enabled: syncEnabled }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 font-mono";

  return (
    <div className="min-h-screen bg-[#050505] p-6 max-w-lg">
      <button onClick={() => router.back()} className="text-xs font-mono text-white/30 hover:text-white/60 mb-6 block">← Back to Kanban</button>
      <h1 className="text-lg font-mono tracking-widest text-white mb-1">⚙ VAULT SETTINGS</h1>
      <p className="text-xs text-white/30 font-mono mb-6">Point to your Obsidian vault to enable bidirectional task sync.</p>

      <div className="flex flex-col gap-4 p-4 border border-white/10 rounded-sm">
        <div>
          <label className="text-xs font-mono text-white/40 block mb-1.5">OBSIDIAN VAULT PATH</label>
          <input className={fieldClass} placeholder="e.g. C:/Users/Phill/ObsidianVault" value={vaultPath} onChange={e => setVaultPath(e.target.value)} />
          <p className="text-xs text-white/20 font-mono mt-1">Absolute path to your vault. Tasks will sync to/from the Tasks/ subfolder.</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-white/60">Enable sync</span>
          <button onClick={() => setSyncEnabled(!syncEnabled)}
            className={`w-10 h-5 rounded-sm border transition-colors relative ${syncEnabled ? 'bg-cyan-400/20 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}>
            <span className={`block w-4 h-4 rounded-sm transition-transform absolute top-0.5 ${syncEnabled ? 'translate-x-5 bg-cyan-400' : 'translate-x-0.5 bg-white/20'}`} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving || !vaultPath}
          className="py-2 text-sm font-mono bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 rounded-sm transition-colors disabled:opacity-50">
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save & Start Sync'}
        </button>
      </div>
    </div>
  );
}
