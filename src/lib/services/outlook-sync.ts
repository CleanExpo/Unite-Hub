import { db } from "@/lib/db";
import { syncOutlookEmailsWithMultiple } from "@/lib/integrations/outlook";

/**
 * Sync all active Outlook accounts for an organization
 */
export async function syncAllOutlookAccounts(orgId: string) {
  try {
    // Get all active Outlook integrations for the org
    const integrations = await db.emailIntegrations.getByOrg(orgId);
    const outlookIntegrations = integrations.filter(
      (i) => i.provider === "outlook" && i.is_active
    );

    if (outlookIntegrations.length === 0) {
      return {
        success: true,
        message: "No active Outlook accounts found",
        results: [],
      };
    }

    const results = [];

    for (const integration of outlookIntegrations) {
      try {
        const result = await syncOutlookEmailsWithMultiple(integration.id);
        results.push({
          integrationId: integration.id,
          accountEmail: integration.account_email,
          success: true,
          imported: result.imported,
          total: result.total,
        });
      } catch (error) {
        console.error(
          `Failed to sync Outlook account ${integration.account_email}:`,
          error
        );
        results.push({
          integrationId: integration.id,
          accountEmail: integration.account_email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const totalImported = results.reduce(
      (sum, r) => sum + (r.imported || 0),
      0
    );
    const successCount = results.filter((r) => r.success).length;

    return {
      success: true,
      message: `Synced ${successCount}/${outlookIntegrations.length} Outlook accounts`,
      totalImported,
      results,
    };
  } catch (error) {
    console.error("Sync all Outlook accounts error:", error);
    throw error;
  }
}

/**
 * Get all Outlook accounts for an organization with their status
 */
export async function getOutlookAccounts(orgId: string) {
  try {
    const integrations = await db.emailIntegrations.getByOrg(orgId);
    const outlookIntegrations = integrations.filter(
      (i) => i.provider === "outlook"
    );

    return outlookIntegrations.map((integration) => ({
      id: integration.id,
      accountEmail: integration.account_email,
      isActive: integration.is_active,
      lastSyncAt: integration.last_sync_at,
      tokenExpiresAt: integration.token_expires_at,
      createdAt: integration.created_at,
    }));
  } catch (error) {
    console.error("Get Outlook accounts error:", error);
    throw error;
  }
}

/**
 * Toggle Outlook account active status
 */
export async function toggleOutlookAccount(
  integrationId: string,
  isActive: boolean
) {
  try {
    await db.emailIntegrations.update(integrationId, {
      is_active: isActive,
    });

    return {
      success: true,
      message: `Outlook account ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (error) {
    console.error("Toggle Outlook account error:", error);
    throw error;
  }
}

/**
 * Set primary Outlook account (for sending emails)
 * Note: This requires adding a 'is_primary' field to email_integrations table
 */
export async function setPrimaryOutlookAccount(
  orgId: string,
  integrationId: string
) {
  try {
    // Get all Outlook integrations for the org
    const integrations = await db.emailIntegrations.getByOrg(orgId);
    const outlookIntegrations = integrations.filter(
      (i) => i.provider === "outlook"
    );

    // Set all to non-primary
    for (const integration of outlookIntegrations) {
      if (integration.id !== integrationId) {
        await db.emailIntegrations.update(integration.id, {
          is_primary: false,
        });
      }
    }

    // Set the selected one as primary
    await db.emailIntegrations.update(integrationId, {
      is_primary: true,
    });

    return {
      success: true,
      message: "Primary Outlook account updated",
    };
  } catch (error) {
    console.error("Set primary Outlook account error:", error);
    throw error;
  }
}

/**
 * Get primary Outlook account for sending emails
 */
export async function getPrimaryOutlookAccount(orgId: string) {
  try {
    const integrations = await db.emailIntegrations.getByOrg(orgId);
    const outlookIntegrations = integrations.filter(
      (i) => i.provider === "outlook" && i.is_active
    );

    // Return the primary one if set
    const primary = outlookIntegrations.find((i) => i.is_primary);
    if (primary) return primary;

    // Otherwise return the first active one
    return outlookIntegrations[0] || null;
  } catch (error) {
    console.error("Get primary Outlook account error:", error);
    throw error;
  }
}

/**
 * Add label/tag to Outlook account for organization
 */
export async function labelOutlookAccount(
  integrationId: string,
  label: string
) {
  try {
    await db.emailIntegrations.update(integrationId, {
      account_label: label,
    });

    return {
      success: true,
      message: "Account label updated",
    };
  } catch (error) {
    console.error("Label Outlook account error:", error);
    throw error;
  }
}
