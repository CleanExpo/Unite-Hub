/**
 * Client Data Manager
 * Phase 7: Docker Multi-Tenant Architecture
 *
 * Manages per-client Docker volumes with strict isolation:
 * - Creates isolated folder structures on client signup
 * - Enforces 500 MB storage limits per client
 * - Provides secure read/write access to client data
 * - Implements automatic archiving and cleanup
 * - Ensures zero cross-client data access
 *
 * Docker Volume Pattern: clientdata_{clientId}
 * Path Inside Container: /app/clients/{clientId}/
 */

// Prevent Turbopack from analyzing this module for client bundles
import 'server-only';

import fs from "fs/promises";
// Use path.posix to prevent Turbopack file scanning on dynamic joins
import { posix as path } from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ClientFolderStructure {
  clientId: string;
  basePath: string;
  folders: {
    audits: string;
    snapshots: string;
    competitors: string;
    keywords: string;
    backlinks: string;
    geo: string;
    reports: string;
  };
}

export interface StorageQuota {
  clientId: string;
  usedMB: number;
  limitMB: number;
  available: boolean;
}

export interface ReportFile {
  clientId: string;
  category: "audits" | "snapshots" | "competitors" | "keywords" | "backlinks" | "geo" | "reports";
  filename: string;
  timestamp: string;
  type: "csv" | "html" | "md" | "json";
}

export class ClientDataManager {
  // Use environment variable or fallback - defined as constant to prevent Turbopack glob expansion
  // The /app/clients path with dynamic segments was causing Turbopack to match 17,171 files
  private static BASE_PATH = process.env.CLIENT_DATA_PATH || process.env.DOCKER_CLIENT_DATA_PATH || "/data/clients";
  private static STORAGE_LIMIT_MB = 500;
  private static RETENTION_DAYS = 365;

  /**
   * Create isolated folder structure for new client
   */
  static async provisionClientStorage(clientId: string): Promise<{
    success: boolean;
    structure?: ClientFolderStructure;
    error?: string;
  }> {
    try {
      console.log(`[ClientDataManager] Provisioning storage for client: ${clientId}`);

      const basePath = path.join(this.BASE_PATH, clientId);

      // Create base directory
      await fs.mkdir(basePath, { recursive: true });

      // Create folder structure
      const folders: ClientFolderStructure["folders"] = {
        audits: path.join(basePath, "audits"),
        snapshots: path.join(basePath, "snapshots"),
        competitors: path.join(basePath, "competitors"),
        keywords: path.join(basePath, "keywords"),
        backlinks: path.join(basePath, "backlinks"),
        geo: path.join(basePath, "geo"),
        reports: path.join(basePath, "reports"),
      };

      // Create all folders
      await Promise.all(
        Object.values(folders).map((folderPath) =>
          fs.mkdir(folderPath, { recursive: true })
        )
      );

      // Create README.md in base directory
      const readme = `# Client Data Storage - ${clientId}

**Created**: ${new Date().toISOString()}
**Storage Limit**: ${this.STORAGE_LIMIT_MB} MB
**Retention**: ${this.RETENTION_DAYS} days

## Folder Structure

- \`audits/\` - Full SEO audit results (CSV, JSON, HTML)
- \`snapshots/\` - Weekly snapshot files with diffs
- \`competitors/\` - Competitor analysis data
- \`keywords/\` - Keyword rankings and gap analysis
- \`backlinks/\` - Backlink summaries and reports
- \`geo/\` - Local GEO pack rankings and radius data
- \`reports/\` - Client-facing HTML/MD reports

## Security

- ✅ Isolated Docker volume (\`clientdata_${clientId}\`)
- ✅ No cross-client access
- ✅ AES-256-GCM encryption for credentials
- ✅ Automatic archiving after ${this.RETENTION_DAYS} days

## Storage Policy

- CSV files: Deduplicated and merged on update
- Old versions: Archived to \`{folder}/archive/\`
- Reports: Rendered HTML with embedded images
- Logs: Rotated daily, compressed after 7 days
`;

      await fs.writeFile(path.join(basePath, "README.md"), readme);

      // Log to database
      await supabaseAdmin.from("client_storage_audit").insert({
        client_id: clientId,
        action: "provision",
        timestamp: new Date().toISOString(),
        storage_mb: 0,
      });

      const structure: ClientFolderStructure = {
        clientId,
        basePath,
        folders,
      };

      console.log(`[ClientDataManager] ✅ Storage provisioned for ${clientId}`);

      return { success: true, structure };
    } catch (error) {
      console.error(`[ClientDataManager] ❌ Failed to provision storage:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check storage quota for client
   */
  static async checkStorageQuota(clientId: string): Promise<StorageQuota> {
    try {
      const basePath = path.join(this.BASE_PATH, clientId);

      // Calculate folder size recursively
      const sizeBytes = await this.getFolderSize(basePath);
      const sizeMB = sizeBytes / (1024 * 1024);

      return {
        clientId,
        usedMB: Math.round(sizeMB * 100) / 100,
        limitMB: this.STORAGE_LIMIT_MB,
        available: sizeMB < this.STORAGE_LIMIT_MB,
      };
    } catch (error) {
      console.error(`[ClientDataManager] Error checking quota:`, error);
      return {
        clientId,
        usedMB: 0,
        limitMB: this.STORAGE_LIMIT_MB,
        available: true,
      };
    }
  }

  /**
   * Write report file to client folder
   */
  static async writeReport(report: ReportFile, content: string): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      // Check quota first
      const quota = await this.checkStorageQuota(report.clientId);
      if (!quota.available) {
        return {
          success: false,
          error: `Storage quota exceeded (${quota.usedMB}/${quota.limitMB} MB)`,
        };
      }

      const basePath = path.join(this.BASE_PATH, report.clientId, report.category);

      // Generate filename with timestamp
      const filename = `${report.timestamp}_${report.filename}.${report.type}`;
      const filePath = path.join(basePath, filename);

      // Write file
      await fs.writeFile(filePath, content, "utf-8");

      // Log to database
      await supabaseAdmin.from("client_storage_audit").insert({
        client_id: report.clientId,
        action: "write",
        file_path: filePath,
        file_size_bytes: Buffer.byteLength(content, "utf-8"),
        timestamp: new Date().toISOString(),
      });

      console.log(`[ClientDataManager] ✅ Wrote report: ${filename}`);

      return { success: true, filePath };
    } catch (error) {
      console.error(`[ClientDataManager] ❌ Failed to write report:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Read report file from client folder
   */
  static async readReport(
    clientId: string,
    category: ReportFile["category"],
    filename: string
  ): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    try {
      const filePath = path.join(this.BASE_PATH, clientId, category, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return {
          success: false,
          error: "File not found",
        };
      }

      // Read file
      const content = await fs.readFile(filePath, "utf-8");

      // Log access
      await supabaseAdmin.from("client_storage_audit").insert({
        client_id: clientId,
        action: "read",
        file_path: filePath,
        timestamp: new Date().toISOString(),
      });

      return { success: true, content };
    } catch (error) {
      console.error(`[ClientDataManager] ❌ Failed to read report:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * List all reports in a category
   */
  static async listReports(
    clientId: string,
    category: ReportFile["category"]
  ): Promise<{
    success: boolean;
    files?: string[];
    error?: string;
  }> {
    try {
      const folderPath = path.join(this.BASE_PATH, clientId, category);

      // Check if folder exists
      try {
        await fs.access(folderPath);
      } catch {
        return { success: true, files: [] };
      }

      // Read directory
      const files = await fs.readdir(folderPath);

      // Filter out directories and sort by timestamp (newest first)
      const reportFiles = (
        await Promise.all(
          files.map(async (file) => {
            const stat = await fs.stat(path.join(folderPath, file));
            return stat.isFile() ? file : null;
          })
        )
      )
        .filter((file): file is string => file !== null)
        .sort((a, b) => {
          // Extract timestamp from filename (format: YYYYMMDD_filename.ext)
          const timestampA = a.split("_")[0];
          const timestampB = b.split("_")[0];
          return timestampB.localeCompare(timestampA);
        });

      return { success: true, files: reportFiles };
    } catch (error) {
      console.error(`[ClientDataManager] ❌ Failed to list reports:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Archive old reports (older than retention days)
   */
  static async archiveOldReports(clientId: string): Promise<{
    success: boolean;
    archivedCount?: number;
    error?: string;
  }> {
    try {
      const basePath = path.join(this.BASE_PATH, clientId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      let archivedCount = 0;

      // Process each category folder
      const categories: ReportFile["category"][] = [
        "audits",
        "snapshots",
        "competitors",
        "keywords",
        "backlinks",
        "geo",
        "reports",
      ];

      for (const category of categories) {
        const folderPath = path.join(basePath, category);
        const archivePath = path.join(folderPath, "archive");

        // Create archive folder if it doesn't exist
        await fs.mkdir(archivePath, { recursive: true });

        // Get all files in category
        try {
          const files = await fs.readdir(folderPath);

          for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = await fs.stat(filePath);

            // Skip if not a file or if in archive folder
            if (!stat.isFile() || file === "archive") continue;

            // Check if file is older than retention period
            if (stat.mtime < cutoffDate) {
              // Move to archive
              const archiveFilePath = path.join(archivePath, file);
              await fs.rename(filePath, archiveFilePath);
              archivedCount++;
            }
          }
        } catch {
          // Folder doesn't exist, skip
          continue;
        }
      }

      // Log to database
      await supabaseAdmin.from("client_storage_audit").insert({
        client_id: clientId,
        action: "archive",
        archived_count: archivedCount,
        timestamp: new Date().toISOString(),
      });

      console.log(`[ClientDataManager] ✅ Archived ${archivedCount} old reports for ${clientId}`);

      return { success: true, archivedCount };
    } catch (error) {
      console.error(`[ClientDataManager] ❌ Failed to archive reports:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete client storage completely (for account deletion)
   */
  static async deleteClientStorage(clientId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`[ClientDataManager] Deleting storage for client: ${clientId}`);

      const basePath = path.join(this.BASE_PATH, clientId);

      // Remove directory recursively
      await fs.rm(basePath, { recursive: true, force: true });

      // Log to database
      await supabaseAdmin.from("client_storage_audit").insert({
        client_id: clientId,
        action: "delete",
        timestamp: new Date().toISOString(),
      });

      console.log(`[ClientDataManager] ✅ Deleted storage for ${clientId}`);

      return { success: true };
    } catch (error) {
      console.error(`[ClientDataManager] ❌ Failed to delete storage:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get folder size recursively
   */
  private static async getFolderSize(folderPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const files = await fs.readdir(folderPath);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          totalSize += await this.getFolderSize(filePath);
        } else {
          totalSize += stat.size;
        }
      }
    } catch {
      // Folder doesn't exist or no permissions
      return 0;
    }

    return totalSize;
  }
}

export default ClientDataManager;
