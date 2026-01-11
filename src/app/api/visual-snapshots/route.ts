/**
 * Visual Snapshots API
 *
 * Lists and serves Playwright visual regression snapshots.
 * Reads from tests/visual/*-snapshots/ directories.
 *
 * GET /api/visual-snapshots - List all snapshots with metadata
 * GET /api/visual-snapshots?file=<path> - Serve specific image
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SnapshotInfo {
  name: string;
  testName: string;
  viewport: string;
  expectedPath: string;
  actualPath: string | null;
  diffPath: string | null;
  status: 'passed' | 'changed' | 'new' | 'missing';
  expectedSize: number;
  actualSize: number | null;
  lastModified: string;
}

const SNAPSHOTS_DIR = path.join(process.cwd(), 'tests/visual');
const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');

function findSnapshotDirs(): string[] {
  const dirs: string[] = [];

  try {
    const entries = fs.readdirSync(SNAPSHOTS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith('-snapshots')) {
        dirs.push(path.join(SNAPSHOTS_DIR, entry.name));
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return dirs;
}

function getSnapshotStatus(
  expectedPath: string,
  actualPath: string | null,
  diffPath: string | null
): 'passed' | 'changed' | 'new' | 'missing' {
  if (!fs.existsSync(expectedPath)) {
    return 'new';
  }
  if (diffPath && fs.existsSync(diffPath)) {
    return 'changed';
  }
  if (actualPath && fs.existsSync(actualPath)) {
    return 'changed';
  }
  return 'passed';
}

function listSnapshots(): SnapshotInfo[] {
  const snapshots: SnapshotInfo[] = [];
  const snapshotDirs = findSnapshotDirs();

  for (const dir of snapshotDirs) {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        if (!file.endsWith('.png')) {
continue;
}

        const expectedPath = path.join(dir, file);
        const stats = fs.statSync(expectedPath);

        // Parse filename to extract test name and viewport
        // Format: test-name-viewport.png
        const baseName = file.replace('.png', '');
        const parts = baseName.split('-');
        const viewport = parts.pop() || 'desktop';
        const testName = parts.join('-');

        // Look for actual/diff in test-results
        let actualPath: string | null = null;
        let diffPath: string | null = null;

        // Check test-results for actual/diff images
        const testResultPattern = path.join(TEST_RESULTS_DIR, '**', `*${baseName}*`);
        try {
          const testResultDirs = fs.readdirSync(TEST_RESULTS_DIR, { withFileTypes: true });
          for (const resultDir of testResultDirs) {
            if (resultDir.isDirectory()) {
              const resultPath = path.join(TEST_RESULTS_DIR, resultDir.name);
              const resultFiles = fs.readdirSync(resultPath);

              for (const rf of resultFiles) {
                if (rf.includes(baseName) || rf.includes(file.replace('.png', ''))) {
                  if (rf.includes('actual')) {
                    actualPath = path.join(resultPath, rf);
                  } else if (rf.includes('diff')) {
                    diffPath = path.join(resultPath, rf);
                  }
                }
              }
            }
          }
        } catch {
          // test-results doesn't exist
        }

        snapshots.push({
          name: file,
          testName,
          viewport,
          expectedPath: expectedPath.replace(process.cwd(), ''),
          actualPath: actualPath?.replace(process.cwd(), '') || null,
          diffPath: diffPath?.replace(process.cwd(), '') || null,
          status: getSnapshotStatus(expectedPath, actualPath, diffPath),
          expectedSize: stats.size,
          actualSize: actualPath && fs.existsSync(actualPath)
            ? fs.statSync(actualPath).size
            : null,
          lastModified: stats.mtime.toISOString(),
        });
      }
    } catch {
      // Error reading directory
    }
  }

  return snapshots.sort((a, b) => a.testName.localeCompare(b.testName));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  // Serve specific image file
  if (file) {
    const filePath = path.join(process.cwd(), file);

    // Security: ensure path is within project
    if (!filePath.startsWith(process.cwd())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(filePath);
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  }

  // List all snapshots
  const snapshots = listSnapshots();

  const summary = {
    total: snapshots.length,
    passed: snapshots.filter(s => s.status === 'passed').length,
    changed: snapshots.filter(s => s.status === 'changed').length,
    new: snapshots.filter(s => s.status === 'new').length,
    missing: snapshots.filter(s => s.status === 'missing').length,
  };

  return NextResponse.json({
    summary,
    snapshots,
    snapshotDirs: findSnapshotDirs().map(d => d.replace(process.cwd(), '')),
  });
}
