// Site Audit Scanner Utility
// Detects placeholders, dead links, non-functional buttons, and other issues

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface AuditIssue {
  type: 'placeholder' | 'dead-link' | 'missing-image' | 'empty-button' | 'todo-comment' | 'coming-soon';
  severity: 'critical' | 'warning' | 'info';
  file: string;
  line?: number;
  message: string;
  context?: string;
}

export interface AuditReport {
  timestamp: Date;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  issues: AuditIssue[];
  summary: {
    placeholders: number;
    deadLinks: number;
    missingImages: number;
    emptyButtons: number;
    todoComments: number;
    comingSoon: number;
  };
}

export class SiteAuditor {
  private issues: AuditIssue[] = [];
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  async scanProject(): Promise<AuditReport> {
    this.issues = [];
    
    // Scan source files
    await this.scanSourceFiles();
    
    // Scan page routes
    await this.scanPageRoutes();
    
    // Generate report
    return this.generateReport();
  }

  private async scanSourceFiles() {
    const patterns = [
      'src/**/*.{tsx,ts,jsx,js}',
      '!src/**/*.test.{tsx,ts,jsx,js}',
      '!src/**/*.spec.{tsx,ts,jsx,js}',
      '!node_modules/**',
      '!.next/**'
    ];

    const files = await glob(patterns[0], {
      ignore: patterns.slice(1),
      cwd: this.baseDir
    });

    for (const file of files) {
      await this.scanFile(file);
    }
  }

  private async scanFile(filePath: string) {
    const fullPath = path.join(this.baseDir, filePath);
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for TODO comments
      if (line.match(/\/\/\s*TODO|\/\*\s*TODO|\{\s*\/\*\s*TODO/i)) {
        this.issues.push({
          type: 'todo-comment',
          severity: 'info',
          file: filePath,
          line: index + 1,
          message: 'TODO comment found',
          context: line.trim()
        });
      }

      // Check for placeholder text
      const placeholderPatterns = [
        /placeholder/i,
        /lorem\s+ipsum/i,
        /coming\s+soon/i,
        /under\s+construction/i,
        /work\s+in\s+progress/i,
        /\[placeholder\]/i,
        /\{placeholder\}/i
      ];

      placeholderPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          this.issues.push({
            type: 'placeholder',
            severity: 'warning',
            file: filePath,
            line: index + 1,
            message: `Placeholder text detected: ${pattern}`,
            context: line.trim()
          });
        }
      });

      // Check for empty onClick handlers
      if (line.match(/onClick=\{[\s]*\}|onClick=\{[\s]*\(\)[\s]*=>[\s]*\{[\s]*\}[\s]*\}/)) {
        this.issues.push({
          type: 'empty-button',
          severity: 'critical',
          file: filePath,
          line: index + 1,
          message: 'Empty onClick handler detected',
          context: line.trim()
        });
      }

      // Check for coming soon features
      if (line.match(/coming\s+soon|feature\s+coming\s+soon|available\s+soon/i)) {
        this.issues.push({
          type: 'coming-soon',
          severity: 'warning',
          file: filePath,
          line: index + 1,
          message: 'Coming soon feature detected',
          context: line.trim()
        });
      }

      // Check for hardcoded localhost links
      if (line.match(/localhost:\d+|127\.0\.0\.1:\d+/)) {
        this.issues.push({
          type: 'dead-link',
          severity: 'critical',
          file: filePath,
          line: index + 1,
          message: 'Hardcoded localhost URL detected',
          context: line.trim()
        });
      }
    });
  }

  private async scanPageRoutes() {
    const pageDir = path.join(this.baseDir, 'src/app');
    const pageFiles = await glob('**/page.{tsx,ts,jsx,js}', {
      cwd: pageDir,
      ignore: ['api/**']
    });

    // Check for missing metadata
    for (const pageFile of pageFiles) {
      const fullPath = path.join(pageDir, pageFile);
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      
      if (!content.includes('export const metadata') && !content.includes('generateMetadata')) {
        this.issues.push({
          type: 'placeholder',
          severity: 'warning',
          file: `src/app/${pageFile}`,
          message: 'Page missing metadata export'
        });
      }
    }
  }

  private generateReport(): AuditReport {
    const summary = {
      placeholders: 0,
      deadLinks: 0,
      missingImages: 0,
      emptyButtons: 0,
      todoComments: 0,
      comingSoon: 0
    };

    let criticalIssues = 0;
    let warningIssues = 0;
    let infoIssues = 0;

    this.issues.forEach(issue => {
      // Count by type
      switch (issue.type) {
        case 'placeholder':
          summary.placeholders++;
          break;
        case 'dead-link':
          summary.deadLinks++;
          break;
        case 'missing-image':
          summary.missingImages++;
          break;
        case 'empty-button':
          summary.emptyButtons++;
          break;
        case 'todo-comment':
          summary.todoComments++;
          break;
        case 'coming-soon':
          summary.comingSoon++;
          break;
      }

      // Count by severity
      switch (issue.severity) {
        case 'critical':
          criticalIssues++;
          break;
        case 'warning':
          warningIssues++;
          break;
        case 'info':
          infoIssues++;
          break;
      }
    });

    return {
      timestamp: new Date(),
      totalIssues: this.issues.length,
      criticalIssues,
      warningIssues,
      infoIssues,
      issues: this.issues,
      summary
    };
  }

  // Export report to JSON
  async exportReport(report: AuditReport, outputPath: string) {
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
  }

  // Export report to CSV
  async exportReportCSV(report: AuditReport, outputPath: string) {
    const csv = [
      'Type,Severity,File,Line,Message,Context',
      ...report.issues.map(issue => 
        `"${issue.type}","${issue.severity}","${issue.file}","${issue.line || ''}","${issue.message}","${issue.context || ''}"`
      )
    ].join('\n');

    await fs.promises.writeFile(outputPath, csv, 'utf-8');
  }
}

// Placeholder handler for development
export function handlePlaceholderClick(feature: string) {
  if (typeof window !== 'undefined') {
    // Use native alert or your toast library
    alert(`${feature} is coming soon! Expected release: Q3 2025`);
  }
}

// Feature flag system
export const featureFlags = {
  emailIntegration: false,
  advancedAnalytics: false,
  aiAssistant: false,
  teamCollaboration: true,
  advancedReporting: false,
  customWorkflows: false
};

export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] || false;
}
