// src/server/obsidian-sync/writer.ts
import fs from 'fs/promises';
import path from 'path';
import { Task } from '@/types/kanban';
import { taskToMarkdown } from './parser';

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function writeTaskToVault(task: Task, vaultPath: string): Promise<string> {
  const statusDir = path.join(vaultPath, 'Tasks', task.status);
  await fs.mkdir(statusDir, { recursive: true });

  const idSuffix = task.id.slice(-8); // last 8 chars of UUID for uniqueness
  const filename = `${slugify(task.title)}-${idSuffix}.md`;
  const filePath = path.join(statusDir, filename);
  const obsidianPath = `Tasks/${task.status}/${filename}`;

  await fs.writeFile(filePath, taskToMarkdown(task), 'utf-8');
  return obsidianPath;
}

export async function moveTaskFile(
  oldPath: string, newStatus: string, vaultPath: string
): Promise<string> {
  const fullOldPath = path.join(vaultPath, oldPath);
  const filename = path.basename(oldPath);
  const newDir = path.join(vaultPath, 'Tasks', newStatus);
  await fs.mkdir(newDir, { recursive: true });
  const newRelPath = `Tasks/${newStatus}/${filename}`;
  try {
    await fs.rename(fullOldPath, path.join(vaultPath, newRelPath));
    return newRelPath;
  } catch (err) {
    console.error('[ObsidianSync] moveTaskFile failed', oldPath, err);
    return oldPath; // return original path on failure — don't corrupt DB
  }
}

export async function deleteTaskFile(obsidianPath: string, vaultPath: string): Promise<void> {
  await fs.unlink(path.join(vaultPath, obsidianPath)).catch(() => {});
}
