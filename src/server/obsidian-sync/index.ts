// src/server/obsidian-sync/index.ts
export { initSync, subscribeToEvents } from './sync-engine';
export { writeTaskToVault, moveTaskFile, deleteTaskFile } from './writer';
export { startWatcher, stopWatcher } from './watcher';
