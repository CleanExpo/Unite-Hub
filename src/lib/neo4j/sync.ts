/**
 * Neo4j Data Synchronization
 *
 * Utilities for syncing data from Supabase PostgreSQL to Neo4j graph database.
 * Maintains data consistency between relational and graph representations.
 *
 * @module lib/neo4j/sync
 */

import { createClient } from '@/lib/supabase/server';
import {
  upsertContact,
  upsertCompany,
  createEmail,
  createWorkspace,
  linkContactToCompany,
  type ContactEntity,
  type CompanyEntity,
  type EmailEntity,
  type WorkspaceEntity,
} from './entities';

/**
 * Sync result interface
 */
export interface SyncResult {
  success: boolean;
  synced: {
    contacts: number;
    companies: number;
    emails: number;
    workspaces: number;
    relationships: number;
  };
  errors: Array<{ type: string; message: string }>;
  duration_ms: number;
}

/**
 * Sync all workspaces from Supabase to Neo4j
 *
 * @returns Sync result
 */
export async function syncWorkspaces(): Promise<{
  count: number;
  errors: string[];
}> {
  const supabase = createClient();
  const errors: string[] = [];
  let count = 0;

  try {
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id, org_id, name, created_at');

    if (error) throw error;

    for (const workspace of workspaces || []) {
      try {
        const workspaceEntity: WorkspaceEntity = {
          id: workspace.id,
          org_id: workspace.org_id,
          name: workspace.name,
          created_at: workspace.created_at,
        };

        await createWorkspace(workspaceEntity);
        count++;
      } catch (err: any) {
        errors.push(`Workspace ${workspace.id}: ${err.message}`);
      }
    }

    return { count, errors };
  } catch (error: any) {
    errors.push(`Workspace sync failed: ${error.message}`);
    return { count, errors };
  }
}

/**
 * Sync contacts from Supabase to Neo4j for a specific workspace
 *
 * @param workspaceId - Workspace ID to sync
 * @param limit - Maximum contacts to sync (default: 1000)
 * @returns Sync result with count and errors
 */
export async function syncContacts(
  workspaceId: string,
  limit: number = 1000
): Promise<{ count: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let count = 0;

  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(limit);

    if (error) throw error;

    for (const contact of contacts || []) {
      try {
        const contactEntity: ContactEntity = {
          id: contact.id,
          workspace_id: contact.workspace_id,
          email: contact.email,
          name: contact.name,
          phone: contact.phone,
          company: contact.company,
          status: contact.status,
          ai_score: contact.ai_score,
          metadata: contact.metadata,
          created_at: contact.created_at,
          updated_at: contact.updated_at,
        };

        await upsertContact(contactEntity);
        count++;

        // Link to company if company domain exists
        if (contact.company) {
          const companyDomain = extractDomain(contact.email);
          if (companyDomain) {
            try {
              await linkContactToCompany(contact.email, companyDomain, workspaceId);
            } catch (err) {
              // Ignore company link errors (company might not exist yet)
            }
          }
        }
      } catch (err: any) {
        errors.push(`Contact ${contact.id}: ${err.message}`);
      }
    }

    return { count, errors };
  } catch (error: any) {
    errors.push(`Contact sync failed: ${error.message}`);
    return { count, errors };
  }
}

/**
 * Sync companies from contacts (extract unique domains)
 *
 * @param workspaceId - Workspace ID to sync
 * @returns Sync result with count and errors
 */
export async function syncCompanies(
  workspaceId: string
): Promise<{ count: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let count = 0;

  try {
    // Get unique company domains from contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('email, company')
      .eq('workspace_id', workspaceId)
      .not('company', 'is', null);

    if (error) throw error;

    const companyMap = new Map<string, string>();

    for (const contact of contacts || []) {
      const domain = extractDomain(contact.email);
      if (domain && contact.company) {
        companyMap.set(domain, contact.company);
      }
    }

    for (const [domain, name] of companyMap) {
      try {
        const companyEntity: CompanyEntity = {
          id: generateId(),
          name,
          domain,
          created_at: new Date().toISOString(),
        };

        await upsertCompany(companyEntity);
        count++;
      } catch (err: any) {
        errors.push(`Company ${domain}: ${err.message}`);
      }
    }

    return { count, errors };
  } catch (error: any) {
    errors.push(`Company sync failed: ${error.message}`);
    return { count, errors };
  }
}

/**
 * Sync emails from Supabase to Neo4j for a specific workspace
 *
 * @param workspaceId - Workspace ID to sync
 * @param limit - Maximum emails to sync (default: 5000)
 * @returns Sync result with count and errors
 */
export async function syncEmails(
  workspaceId: string,
  limit: number = 5000
): Promise<{ count: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let count = 0;

  try {
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    for (const email of emails || []) {
      try {
        const emailEntity: EmailEntity = {
          id: email.id,
          workspace_id: email.workspace_id,
          contact_id: email.contact_id,
          subject: email.subject,
          body: email.body,
          direction: email.direction || 'outbound',
          sent_at: email.sent_at,
          opened: email.opened || false,
          clicked: email.clicked || false,
          metadata: email.metadata,
        };

        await createEmail(emailEntity);
        count++;
      } catch (err: any) {
        errors.push(`Email ${email.id}: ${err.message}`);
      }
    }

    return { count, errors };
  } catch (error: any) {
    errors.push(`Email sync failed: ${error.message}`);
    return { count, errors };
  }
}

/**
 * Full sync for a workspace
 *
 * Syncs workspaces, contacts, companies, and emails in order.
 *
 * @param workspaceId - Workspace ID to sync
 * @returns Complete sync result
 */
export async function fullSync(workspaceId: string): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: true,
    synced: {
      contacts: 0,
      companies: 0,
      emails: 0,
      workspaces: 0,
      relationships: 0,
    },
    errors: [],
    duration_ms: 0,
  };

  try {
    console.log(`Starting full sync for workspace ${workspaceId}...`);

    // 1. Sync workspaces
    const workspaceResult = await syncWorkspaces();
    result.synced.workspaces = workspaceResult.count;
    result.errors.push(
      ...workspaceResult.errors.map((e) => ({ type: 'workspace', message: e }))
    );

    // 2. Sync contacts
    const contactResult = await syncContacts(workspaceId);
    result.synced.contacts = contactResult.count;
    result.errors.push(
      ...contactResult.errors.map((e) => ({ type: 'contact', message: e }))
    );

    // 3. Sync companies
    const companyResult = await syncCompanies(workspaceId);
    result.synced.companies = companyResult.count;
    result.errors.push(
      ...companyResult.errors.map((e) => ({ type: 'company', message: e }))
    );

    // 4. Sync emails
    const emailResult = await syncEmails(workspaceId);
    result.synced.emails = emailResult.count;
    result.errors.push(
      ...emailResult.errors.map((e) => ({ type: 'email', message: e }))
    );

    result.success = result.errors.length === 0;
    result.duration_ms = Date.now() - startTime;

    console.log(
      `✓ Full sync complete: ${result.synced.contacts} contacts, ${result.synced.companies} companies, ${result.synced.emails} emails (${result.duration_ms}ms)`
    );

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push({ type: 'system', message: error.message });
    result.duration_ms = Date.now() - startTime;
    return result;
  }
}

/**
 * Extract domain from email address
 *
 * @param email - Email address
 * @returns Domain or null
 */
function extractDomain(email: string): string | null {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : null;
}

/**
 * Generate a UUID-like ID
 *
 * @returns UUID string
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Incremental sync (sync only recent changes)
 *
 * Syncs entities created/updated after the last sync timestamp.
 *
 * @param workspaceId - Workspace ID
 * @param since - Timestamp of last sync
 * @returns Sync result
 */
export async function incrementalSync(
  workspaceId: string,
  since: string
): Promise<SyncResult> {
  const startTime = Date.now();
  const supabase = createClient();
  const result: SyncResult = {
    success: true,
    synced: {
      contacts: 0,
      companies: 0,
      emails: 0,
      workspaces: 0,
      relationships: 0,
    },
    errors: [],
    duration_ms: 0,
  };

  try {
    console.log(`Starting incremental sync since ${since}...`);

    // Sync contacts updated since timestamp
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('updated_at', since);

    if (contactError) throw contactError;

    for (const contact of contacts || []) {
      try {
        await upsertContact({
          id: contact.id,
          workspace_id: contact.workspace_id,
          email: contact.email,
          name: contact.name,
          phone: contact.phone,
          company: contact.company,
          status: contact.status,
          ai_score: contact.ai_score,
          metadata: contact.metadata,
          created_at: contact.created_at,
          updated_at: contact.updated_at,
        });
        result.synced.contacts++;
      } catch (err: any) {
        result.errors.push({ type: 'contact', message: err.message });
      }
    }

    // Sync emails sent since timestamp
    const { data: emails, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('sent_at', since);

    if (emailError) throw emailError;

    for (const email of emails || []) {
      try {
        await createEmail({
          id: email.id,
          workspace_id: email.workspace_id,
          contact_id: email.contact_id,
          subject: email.subject,
          body: email.body,
          direction: email.direction || 'outbound',
          sent_at: email.sent_at,
          opened: email.opened || false,
          clicked: email.clicked || false,
          metadata: email.metadata,
        });
        result.synced.emails++;
      } catch (err: any) {
        result.errors.push({ type: 'email', message: err.message });
      }
    }

    result.success = result.errors.length === 0;
    result.duration_ms = Date.now() - startTime;

    console.log(
      `✓ Incremental sync complete: ${result.synced.contacts} contacts, ${result.synced.emails} emails (${result.duration_ms}ms)`
    );

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push({ type: 'system', message: error.message });
    result.duration_ms = Date.now() - startTime;
    return result;
  }
}
