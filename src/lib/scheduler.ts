import { analyzeWorkspaceContacts } from "@/lib/agents/contact-intelligence";
import { syncGmailEmails } from "@/lib/integrations/gmail";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

// Run every 6 hours
const ANALYSIS_INTERVAL = 6 * 60 * 60 * 1000;
// Run every 30 minutes
const SYNC_INTERVAL = 30 * 60 * 1000;

let lastAnalysisTime = Date.now();
let lastSyncTime = Date.now();

export function startContactIntelligenceScheduler() {
  console.log("📅 Starting Contact Intelligence Scheduler");

  setInterval(async () => {
    try {
      // Get all organizations
      const { data: organizations } = await db.organizations.listAll();

      if (!organizations || organizations.length === 0) {
        console.log("No organizations found");
        return;
      }

      for (const org of organizations) {
        const workspaces = await db.workspaces.listByOrg(org.id);

        for (const workspace of workspaces) {
          console.log(`🤖 Analyzing workspace: ${workspace.name}`);
          await analyzeWorkspaceContacts(workspace.id);

          // Small delay between workspaces
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      lastAnalysisTime = Date.now();
      console.log("✅ Scheduled analysis complete");
    } catch (error) {
      console.error("Scheduler error:", error);
    }
  }, ANALYSIS_INTERVAL);
}

export function startEmailSyncScheduler() {
  console.log("📧 Starting Email Sync Scheduler");

  setInterval(async () => {
    try {
      // Get all active integrations
      const { data: integrations } = await supabase
        .from("email_integrations")
        .select("*")
        .eq("is_active", true);

      if (!integrations || integrations.length === 0) {
        console.log("No active integrations found");
        return;
      }

      for (const integration of integrations) {
        try {
          console.log(
            `📧 Syncing ${integration.provider} for ${integration.account_email}`
          );
          await syncGmailEmails(integration.id);
        } catch (error) {
          console.error(
            `Sync failed for ${integration.account_email}:`,
            error
          );
        }
      }

      lastSyncTime = Date.now();
      console.log("✅ Email sync complete");
    } catch (error) {
      console.error("Email sync scheduler error:", error);
    }
  }, SYNC_INTERVAL);
}

export function startAllSchedulers() {
  startContactIntelligenceScheduler();
  startEmailSyncScheduler();
}

export function getLastAnalysisTime() {
  return lastAnalysisTime;
}

export function getLastSyncTime() {
  return lastSyncTime;
}
