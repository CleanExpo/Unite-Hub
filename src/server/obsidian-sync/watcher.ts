// src/server/obsidian-sync/watcher.ts
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';

type ChangeCallback = (filePath: string, event: 'add' | 'change' | 'unlink') => void;

const watchers = new Map<string, FSWatcher>();

export function startWatcher(vaultPath: string, onChange: ChangeCallback): void {
  if (watchers.has(vaultPath)) return; // already watching

  const tasksDir = path.join(vaultPath, 'Tasks');
  const watcher = chokidar.watch(`${tasksDir}/**/*.md`, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 500 },
  });

  watcher
    .on('add', (p) => onChange(p, 'add'))
    .on('change', (p) => onChange(p, 'change'))
    .on('unlink', (p) => onChange(p, 'unlink'));

  watchers.set(vaultPath, watcher);
  console.log(`[ObsidianSync] Watching ${tasksDir}`);
}

export async function stopWatcher(vaultPath: string): Promise<void> {
  const w = watchers.get(vaultPath);
  if (w) { await w.close(); watchers.delete(vaultPath); }
}
