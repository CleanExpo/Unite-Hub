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

interface CCCScopeRecommendation {
  timestamp: string;
  baseRoot: string;
  recommendedIncludeGlobs: string[];
  recommendedExcludeGlobs: string[];
  notes: string[];
}

function loadJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
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

function safeWriteFile(filePath: string, content: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
  }
}

export async function buildCCCScopeRecommendations(): Promise<CCCScopeRecommendation> {
  const profile = loadJSON<ContextProfile>('reports/context_profile.json', null as unknown as ContextProfile);

  if (!profile) {
    const fallback: CCCScopeRecommendation = {
      timestamp: new Date().toISOString(),
      baseRoot: '.',
      recommendedIncludeGlobs: ['src/**', 'app/**', '.claude/**', 'shadow-observer/**'],
      recommendedExcludeGlobs: ['node_modules/**', '.next/**', '.turbo/**', '.git/**', '.vercel/**', 'dist/**', 'build/**'],
      notes: ['No context_profile.json found. Using generic web-app defaults.']
    };
    safeWriteJSON('reports/ccc_scope_recommendations.json', fallback);
    return fallback;
  }

  const heavyDirs = profile.dirs.filter((d) => d.totalSizeBytes > 1024 * 1024); // >1MB
  const excludeGlobs = new Set<string>();

  for (const ig of profile.ignored) {
    excludeGlobs.add(`${ig}/**`);
  }

  for (const d of heavyDirs) {
    if (d.path.startsWith('public')) continue; // often needed
    if (d.path.startsWith('src') || d.path.startsWith('app')) continue;
    excludeGlobs.add(`${d.path}/**`);
  }

  const includeGlobs = [
    'app/**',
    'src/**',
    'lib/**',
    '.claude/**',
    'shadow-observer/**',
    'supabase/migrations/**'
  ];

  const rec: CCCScopeRecommendation = {
    timestamp: new Date().toISOString(),
    baseRoot: profile.root,
    recommendedIncludeGlobs: includeGlobs,
    recommendedExcludeGlobs: Array.from(excludeGlobs).sort(),
    notes: [
      'Use recommendedIncludeGlobs / recommendedExcludeGlobs in your CCC tasks to keep terminal context lean.',
      'Adjust heavy directories manually if you know certain large assets are important to reasoning.'
    ]
  };

  safeWriteJSON('reports/ccc_scope_recommendations.json', rec);

  const md = [
    '# CCC Scope Recommendations (Shadow Observer)',
    '',
    `Generated: ${rec.timestamp}`,
    '',
    '## Include globs',
    '',
    ...rec.recommendedIncludeGlobs.map((g) => `- \`${g}\``),
    '',
    '## Exclude globs',
    '',
    ...rec.recommendedExcludeGlobs.map((g) => `- \`${g}\``),
    '',
    '### Notes',
    '',
    ...rec.notes.map((n) => `- ${n}`),
    ''
  ].join('\n');

  safeWriteFile('reports/ccc_scope_recommendations.md', md);

  return rec;
}

// Auto-run when imported as main module
buildCCCScopeRecommendations().then(() => {
  console.log('[shadow-observer] CCC scope recommendations written to reports/ccc_scope_recommendations.json');
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
