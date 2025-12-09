import fs from 'fs';
import path from 'path';

interface DirStat {
  path: string;
  totalSizeBytes: number;
  fileCount: number;
}

interface ContextProfile {
  timestamp: string;
  root: string;
  ignored: string[];
  dirs: DirStat[];
  largeFiles: Array<{ path: string; sizeBytes: number }>;
}

const DEFAULT_IGNORES = [
  'node_modules',
  '.next',
  '.turbo',
  '.git',
  '.vercel',
  '.cache',
  'dist',
  'build',
  'coverage',
  'shadow-observer/reports'
];

const LARGE_FILE_THRESHOLD = 250 * 1024; // 250 KB

function shouldIgnore(p: string): boolean {
  return DEFAULT_IGNORES.some((seg) => p.split(path.sep).includes(seg));
}

function safeWriteJSON(filePath: string, data: unknown): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
  }
}

export async function runContextProfiler(rootDir = '.'): Promise<ContextProfile> {
  const root = path.resolve(rootDir);
  const dirsMap = new Map<string, DirStat>();
  const largeFiles: Array<{ path: string; sizeBytes: number }> = [];

  function walk(current: string) {
    if (shouldIgnore(current)) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (shouldIgnore(fullPath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      let stats: fs.Stats;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        continue;
      }

      const dirKey = path.dirname(fullPath).replace(root + path.sep, '');
      const sizeBytes = stats.size;

      if (!dirsMap.has(dirKey)) {
        dirsMap.set(dirKey, { path: dirKey || '.', totalSizeBytes: 0, fileCount: 0 });
      }

      const ds = dirsMap.get(dirKey)!;
      ds.totalSizeBytes += sizeBytes;
      ds.fileCount += 1;

      if (sizeBytes >= LARGE_FILE_THRESHOLD) {
        largeFiles.push({ path: fullPath.replace(root + path.sep, ''), sizeBytes });
      }
    }
  }

  walk(root);

  const dirs = Array.from(dirsMap.values()).sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);
  largeFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const profile: ContextProfile = {
    timestamp: new Date().toISOString(),
    root,
    ignored: DEFAULT_IGNORES,
    dirs,
    largeFiles
  };

  safeWriteJSON('reports/context_profile.json', profile);
  return profile;
}

// Auto-run when imported as main module
runContextProfiler('.').then(() => {
  console.log('[shadow-observer] Context profile written to reports/context_profile.json');
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
