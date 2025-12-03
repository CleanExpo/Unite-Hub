/**
 * File MCP Server
 * Serves Unite-Hub codebase for remote Claude access
 * Port: 3104
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3104;
const REPO_ROOT = process.env.REPO_ROOT || '/repo';

// Excluded paths
const EXCLUDED = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.env',
  '.env.local'
];

function isExcluded(filePath) {
  return EXCLUDED.some(ex => filePath.includes(ex));
}

function getTree(dir, depth = 2, currentDepth = 0) {
  if (currentDepth >= depth) return [];
  
  const results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item.startsWith('.') && item !== '.env.example') continue;
      
      const fullPath = path.join(dir, item);
      const relativePath = fullPath.replace(REPO_ROOT, '');
      
      if (isExcluded(relativePath)) continue;
      
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push({ type: 'dir', path: relativePath });
          results.push(...getTree(fullPath, depth, currentDepth + 1));
        } else {
          results.push({ 
            type: 'file', 
            path: relativePath,
            size: stat.size 
          });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return results;
}

function getFile(filePath) {
  const fullPath = path.join(REPO_ROOT, filePath);
  
  if (isExcluded(filePath)) {
    return { error: 'File excluded for security' };
  }
  
  try {
    const stat = fs.statSync(fullPath);
    if (stat.size > 500000) {
      return { error: 'File too large (>500KB)', size: stat.size };
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    return { path: filePath, content, size: stat.size };
  } catch (e) {
    return { error: 'File not found', path: filePath };
  }
}

function searchFiles(query, glob = '*') {
  try {
    const cmd = `grep -r -l --include="${glob}" "${query}" ${REPO_ROOT} 2>/dev/null | head -30`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 5000 });
    return result.split('\n')
      .filter(Boolean)
      .map(f => f.replace(REPO_ROOT, ''));
  } catch (e) {
    return [];
  }
}

function grepFiles(pattern, glob = '*.ts') {
  try {
    const cmd = `grep -r -n --include="${glob}" "${pattern}" ${REPO_ROOT} 2>/dev/null | head -50`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 5000 });
    return result.split('\n')
      .filter(Boolean)
      .map(line => {
        const cleaned = line.replace(REPO_ROOT, '');
        const [filePath, ...rest] = cleaned.split(':');
        const lineNum = rest[0];
        const content = rest.slice(1).join(':');
        return { file: filePath, line: parseInt(lineNum), content: content.trim() };
      });
  } catch (e) {
    return [];
  }
}

function getStructure() {
  // Get key structural files
  const structure = {
    packageJson: null,
    tsconfig: null,
    middleware: null,
    appRoutes: [],
    components: [],
    lib: []
  };
  
  try {
    structure.packageJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
  } catch (e) {}
  
  try {
    const appDir = path.join(REPO_ROOT, 'src/app');
    if (fs.existsSync(appDir)) {
      structure.appRoutes = getTree(appDir, 3).filter(f => f.type === 'dir').map(f => f.path);
    }
  } catch (e) {}
  
  try {
    const componentsDir = path.join(REPO_ROOT, 'src/components');
    if (fs.existsSync(componentsDir)) {
      structure.components = getTree(componentsDir, 2).map(f => f.path);
    }
  } catch (e) {}
  
  try {
    const libDir = path.join(REPO_ROOT, 'src/lib');
    if (fs.existsSync(libDir)) {
      structure.lib = getTree(libDir, 2).map(f => f.path);
    }
  } catch (e) {}
  
  return structure;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  let response;
  
  try {
    if (pathname === '/health') {
      response = { status: 'healthy', service: 'file-mcp', version: '1.0' };
      
    } else if (pathname === '/structure') {
      response = getStructure();
      
    } else if (pathname === '/tree' || pathname.startsWith('/tree/')) {
      const subpath = pathname.replace('/tree', '') || '/';
      const depth = parseInt(url.searchParams.get('depth') || '2');
      response = getTree(path.join(REPO_ROOT, subpath), depth);
      
    } else if (pathname.startsWith('/file/')) {
      const filePath = pathname.replace('/file', '');
      response = getFile(filePath);
      
    } else if (pathname.startsWith('/search/')) {
      const query = pathname.replace('/search/', '');
      const glob = url.searchParams.get('glob') || '*';
      response = { query, glob, files: searchFiles(query, glob) };
      
    } else if (pathname.startsWith('/grep/')) {
      const rest = pathname.replace('/grep/', '');
      const [pattern, glob] = rest.split('/');
      response = { pattern, glob: glob || '*.ts', matches: grepFiles(pattern, glob || '*.ts') };
      
    } else if (pathname === '/files') {
      // Bulk file fetch
      const files = url.searchParams.get('paths')?.split(',') || [];
      response = files.map(f => getFile(f.trim()));
      
    } else {
      response = {
        service: 'file-mcp',
        endpoints: {
          '/health': 'Health check',
          '/structure': 'Get project structure overview',
          '/tree': 'List all files (depth=2)',
          '/tree/{path}?depth=N': 'List files in directory',
          '/file/{path}': 'Get file contents',
          '/files?paths=a,b,c': 'Get multiple files',
          '/search/{query}?glob=*.ts': 'Find files containing text',
          '/grep/{pattern}/{glob}': 'Grep with line numbers'
        }
      };
    }
    
    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
    
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
  
  console.log(`[FILE-MCP] ${req.method} ${pathname}`);
});

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  File MCP Server - Port ${PORT}          ║`);
  console.log(`╠════════════════════════════════════════╣`);
  console.log(`║  Repo: ${REPO_ROOT.padEnd(30)}║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
