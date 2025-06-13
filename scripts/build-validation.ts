import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { ErrorMonitoringService } from '../src/lib/error-detection/ErrorMonitoringService.js';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

class BuildValidator {
  private readonly projectRoot: string;
  private readonly errorMonitor: ErrorMonitoringService;
  private results: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.errorMonitor = ErrorMonitoringService.getInstance();
  }

  public async validate(): Promise<ValidationResult> {
    console.log('🔍 Starting build validation...');

    await Promise.all([
      this.checkForConsoleLogs(),
      this.checkForUnusedExports(),
      this.checkForLargeFiles(),
      this.checkForMissingErrorBoundaries(),
      this.checkForInconsistentImports(),
      this.checkForMemoryLeaks(),
      this.checkForSecurityIssues(),
      this.checkForPerformanceIssues(),
      this.checkForAccessibilityIssues(),
      this.checkForTypeSafetyIssues(),
      this.checkForDeprecatedAPIs(),
      this.checkForHardcodedValues(),
      this.checkForMissingTests(),
      this.checkForInconsistentStyling(),
      this.checkForDuplicateCode(),
    ]);

    console.log('\n📊 Validation Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    if (this.results.errors.length > 0) {
      console.log('❌ Errors:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }
    if (this.results.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      this.results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    return this.results;
  }

  private async checkForConsoleLogs(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    const consoleLogPattern = /console\.(log|debug|info)/;

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (consoleLogPattern.test(content)) {
        this.results.warnings.push(`Found console.log in ${file}`);
        this.errorMonitor.reportError({
          type: 'development',
          severity: 'low',
          message: 'Console.log found in production code',
          component: file,
          metadata: { content: content.match(consoleLogPattern)?.[0] },
        });
      }
    }
  }

  private async checkForUnusedExports(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx']);
    const exportPattern = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const exports = [...content.matchAll(exportPattern)].map(match => match[1]);
      
      for (const exportName of exports) {
        const usagePattern = new RegExp(`\\b${exportName}\\b`, 'g');
        const usageCount = (content.match(usagePattern) || []).length;
        
        if (usageCount <= 1) {
          this.results.warnings.push(`Potentially unused export '${exportName}' in ${file}`);
        }
      }
    }
  }

  private async checkForLargeFiles(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    const MAX_FILE_SIZE = 1000; // lines

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lineCount = content.split('\n').length;

      if (lineCount > MAX_FILE_SIZE) {
        this.results.warnings.push(`Large file detected: ${file} (${lineCount} lines)`);
        this.errorMonitor.reportError({
          type: 'development',
          severity: 'medium',
          message: 'Large file detected',
          component: file,
          metadata: { lineCount },
        });
      }
    }
  }

  private async checkForMissingErrorBoundaries(): Promise<void> {
    const files = this.getAllFiles(['.tsx']);
    const errorBoundaryPattern = /ErrorBoundary/;

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (!errorBoundaryPattern.test(content)) {
        this.results.warnings.push(`No error boundary found in ${file}`);
      }
    }
  }

  private async checkForInconsistentImports(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx']);
    const importPattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const imports = [...content.matchAll(importPattern)].map(match => match[1]);

      for (const importPath of imports) {
        if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
          this.results.warnings.push(`Non-relative import found in ${file}: ${importPath}`);
        }
      }
    }
  }

  private async checkForMemoryLeaks(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx']);
    const patterns = [
      { pattern: /addEventListener\([^,]+,\s*[^)]+\)(?!\s*removeEventListener)/, message: 'Potential memory leak: Event listener without removal' },
      { pattern: /setInterval\([^,]+,\s*\d+\)(?!\s*clearInterval)/, message: 'Potential memory leak: Interval without cleanup' },
      { pattern: /setTimeout\([^,]+,\s*\d+\)(?!\s*clearTimeout)/, message: 'Potential memory leak: Timeout without cleanup' },
      { pattern: /new\s+WebSocket\([^)]+\)(?!\s*\.close\(\))/, message: 'Potential memory leak: WebSocket without close' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.warnings.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForSecurityIssues(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    const patterns = [
      { pattern: /eval\(/, message: 'Security risk: Use of eval()' },
      { pattern: /new\s+Function\(/, message: 'Security risk: Use of Function constructor' },
      { pattern: /innerHTML\s*=/, message: 'Security risk: Direct innerHTML assignment' },
      { pattern: /dangerouslySetInnerHTML/, message: 'Security risk: Use of dangerouslySetInnerHTML' },
      { pattern: /localStorage\.setItem\([^,]+,\s*[^)]+\)/, message: 'Security risk: Storing sensitive data in localStorage' },
      { pattern: /sessionStorage\.setItem\([^,]+,\s*[^)]+\)/, message: 'Security risk: Storing sensitive data in sessionStorage' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.errors.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForPerformanceIssues(): Promise<void> {
    const files = this.getAllFiles(['.tsx']);
    const patterns = [
      { pattern: /useEffect\(\s*\(\s*\)\s*=>\s*{[^}]*}\s*,\s*\[\s*\]\s*\)/, message: 'Performance issue: Empty dependency array in useEffect' },
      { pattern: /useMemo\(\s*\(\s*\)\s*=>\s*{[^}]*}\s*,\s*\[\s*\]\s*\)/, message: 'Performance issue: Empty dependency array in useMemo' },
      { pattern: /useCallback\(\s*\(\s*\)\s*=>\s*{[^}]*}\s*,\s*\[\s*\]\s*\)/, message: 'Performance issue: Empty dependency array in useCallback' },
      { pattern: /\.map\(\s*\(\s*\)\s*=>\s*{/, message: 'Performance issue: Empty map callback' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.warnings.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForAccessibilityIssues(): Promise<void> {
    const files = this.getAllFiles(['.tsx']);
    const patterns = [
      { pattern: /<div\s+onClick=/, message: 'Accessibility issue: Clickable div without role' },
      { pattern: /<img[^>]*>(?!\s*<\/img>)/, message: 'Accessibility issue: Image without alt text' },
      { pattern: /<button[^>]*>(?!\s*<\/button>)/, message: 'Accessibility issue: Empty button' },
      { pattern: /color:\s*#[0-9a-fA-F]{3,6}/, message: 'Accessibility issue: Hardcoded color without contrast check' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.warnings.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForTypeSafetyIssues(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx']);
    const patterns = [
      { pattern: /as\s+any/, message: 'Type safety issue: Use of "as any" type assertion' },
      { pattern: /:\s*any\s*[=,)]/, message: 'Type safety issue: Use of "any" type' },
      { pattern: /!\./, message: 'Type safety issue: Use of non-null assertion operator' },
      { pattern: /as\s+unknown/, message: 'Type safety issue: Use of "as unknown" type assertion' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.warnings.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForDeprecatedAPIs(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    const patterns = [
      { pattern: /componentWillMount/, message: 'Deprecated API: componentWillMount' },
      { pattern: /componentWillReceiveProps/, message: 'Deprecated API: componentWillReceiveProps' },
      { pattern: /componentWillUpdate/, message: 'Deprecated API: componentWillUpdate' },
      { pattern: /findDOMNode/, message: 'Deprecated API: findDOMNode' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.errors.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForHardcodedValues(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    const patterns = [
      { pattern: /'https?:\/\/[^']+'/, message: 'Hardcoded URL found' },
      { pattern: /'[0-9]{4}-[0-9]{2}-[0-9]{2}'/, message: 'Hardcoded date found' },
      { pattern: /'[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'/, message: 'Hardcoded IP address found' },
      { pattern: /'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'/, message: 'Hardcoded email found' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.warnings.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForMissingTests(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx']);
    const testFiles = this.getAllFiles(['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']);

    for (const file of files) {
      const baseName = file.replace(/\.[^/.]+$/, '');
      const hasTest = testFiles.some(testFile => testFile.startsWith(baseName + '.test.') || testFile.startsWith(baseName + '.spec.'));
      
      if (!hasTest) {
        this.results.warnings.push(`Missing test file for ${file}`);
      }
    }
  }

  private async checkForInconsistentStyling(): Promise<void> {
    const files = this.getAllFiles(['.tsx']);
    const patterns = [
      { pattern: /style=\{[^}]+\}/, message: 'Inline styles found' },
      { pattern: /className="[^"]*"/, message: 'Hardcoded className found' },
      { pattern: /!important/, message: 'Use of !important found' },
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, message } of patterns) {
        if (pattern.test(content)) {
          this.results.warnings.push(`${message} in ${file}`);
        }
      }
    }
  }

  private async checkForDuplicateCode(): Promise<void> {
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    const minLength = 6; // Minimum number of lines to consider as duplicate
    const codeBlocks = new Map<string, string[]>();

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length - minLength; i++) {
        const block = lines.slice(i, i + minLength).join('\n');
        if (!codeBlocks.has(block)) {
          codeBlocks.set(block, []);
        }
        codeBlocks.get(block)?.push(`${file}:${i + 1}`);
      }
    }

    for (const [block, locations] of codeBlocks.entries()) {
      if (locations.length > 1) {
        this.results.warnings.push(`Duplicate code found in: ${locations.join(', ')}`);
      }
    }
  }

  private getAllFiles(extensions: string[]): string[] {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walk(fullPath);
          }
        } else if (extensions.includes(extname(entry.name))) {
          files.push(fullPath);
        }
      }
    };

    walk(this.projectRoot);
    return files;
  }
}

// Run the validator if this file is executed directly
if (require.main === module) {
  const validator = new BuildValidator(process.cwd());
  validator.validate().then(result => {
    if (!result.passed || result.errors.length > 0) {
      process.exit(1);
    }
  });
}

export { BuildValidator }; 