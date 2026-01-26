/**
 * Neo4j Entity Management
 *
 * Utilities for creating and managing entities in the knowledge graph:
 * - Contacts
 * - Companies
 * - Emails
 * - Users
 * - Workspaces
 *
 * @module lib/neo4j/entities
 */

import { writeQuery, readQuery, executeTransaction } from './client';
import { NodeTypes, RelationshipTypes } from './schema';

/**
 * Contact entity interface
 */
export interface ContactEntity {
  id: string;
  workspace_id: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  status?: 'lead' | 'prospect' | 'customer';
  ai_score?: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Company entity interface
 */
export interface CompanyEntity {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  location?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * Email entity interface
 */
export interface EmailEntity {
  id: string;
  workspace_id: string;
  contact_id: string;
  subject: string;
  body?: string;
  direction: 'inbound' | 'outbound';
  sent_at: string;
  opened?: boolean;
  clicked?: boolean;
  metadata?: Record<string, any>;
}

/**
 * User entity interface
 */
export interface UserEntity {
  id: string;
  email: string;
  name?: string;
  role?: string;
  workspace_id: string;
  created_at?: string;
}

/**
 * Workspace entity interface
 */
export interface WorkspaceEntity {
  id: string;
  org_id: string;
  name: string;
  created_at?: string;
}

/**
 * Create or update a contact entity
 *
 * Uses MERGE to avoid duplicates (by email + workspace_id).
 *
 * @param contact - Contact data
 * @returns Created/updated contact node
 */
export async function upsertContact(contact: ContactEntity) {
  const query = `
    MERGE (c:Contact {email: $email, workspace_id: $workspace_id})
    ON CREATE SET
      c.id = $id,
      c.name = $name,
      c.phone = $phone,
      c.company = $company,
      c.status = $status,
      c.ai_score = $ai_score,
      c.metadata = $metadata,
      c.created_at = $created_at,
      c.updated_at = $updated_at
    ON MATCH SET
      c.name = COALESCE($name, c.name),
      c.phone = COALESCE($phone, c.phone),
      c.company = COALESCE($company, c.company),
      c.status = COALESCE($status, c.status),
      c.ai_score = COALESCE($ai_score, c.ai_score),
      c.metadata = COALESCE($metadata, c.metadata),
      c.updated_at = $updated_at
    RETURN c
  `;

  const result = await writeQuery(query, {
    ...contact,
    created_at: contact.created_at || new Date().toISOString(),
    updated_at: contact.updated_at || new Date().toISOString(),
  });

  return result.records[0]?.get('c').properties;
}

/**
 * Create or update a company entity
 *
 * Uses MERGE to avoid duplicates (by domain).
 *
 * @param company - Company data
 * @returns Created/updated company node
 */
export async function upsertCompany(company: CompanyEntity) {
  const query = `
    MERGE (c:Company {domain: $domain})
    ON CREATE SET
      c.id = $id,
      c.name = $name,
      c.industry = $industry,
      c.size = $size,
      c.location = $location,
      c.metadata = $metadata,
      c.created_at = $created_at
    ON MATCH SET
      c.name = COALESCE($name, c.name),
      c.industry = COALESCE($industry, c.industry),
      c.size = COALESCE($size, c.size),
      c.location = COALESCE($location, c.location),
      c.metadata = COALESCE($metadata, c.metadata)
    RETURN c
  `;

  const result = await writeQuery(query, {
    ...company,
    created_at: company.created_at || new Date().toISOString(),
  });

  return result.records[0]?.get('c').properties;
}

/**
 * Create an email entity and relationships
 *
 * Creates email node and connects it to contact with SENT/RECEIVED relationship.
 *
 * @param email - Email data
 * @returns Created email node
 */
export async function createEmail(email: EmailEntity) {
  const queries = [
    // Create email node
    {
      query: `
        CREATE (e:Email {
          id: $id,
          workspace_id: $workspace_id,
          contact_id: $contact_id,
          subject: $subject,
          body: $body,
          direction: $direction,
          sent_at: $sent_at,
          opened: $opened,
          clicked: $clicked,
          metadata: $metadata
        })
        RETURN e
      `,
      params: {
        ...email,
        opened: email.opened || false,
        clicked: email.clicked || false,
      },
    },
    // Create relationship to contact
    {
      query: `
        MATCH (c:Contact {id: $contact_id, workspace_id: $workspace_id})
        MATCH (e:Email {id: $email_id})
        CREATE (c)-[r:${email.direction === 'inbound' ? 'RECEIVED' : 'SENT'}]->(e)
        SET r.timestamp = $sent_at
        RETURN r
      `,
      params: {
        contact_id: email.contact_id,
        workspace_id: email.workspace_id,
        email_id: email.id,
        sent_at: email.sent_at,
      },
    },
  ];

  const results = await executeTransaction(queries);
  return results[0].records[0]?.get('e').properties;
}

/**
 * Create a user entity
 *
 * @param user - User data
 * @returns Created user node
 */
export async function createUser(user: UserEntity) {
  const query = `
    MERGE (u:User {email: $email})
    ON CREATE SET
      u.id = $id,
      u.name = $name,
      u.role = $role,
      u.workspace_id = $workspace_id,
      u.created_at = $created_at
    ON MATCH SET
      u.name = COALESCE($name, u.name),
      u.role = COALESCE($role, u.role)
    RETURN u
  `;

  const result = await writeQuery(query, {
    ...user,
    created_at: user.created_at || new Date().toISOString(),
  });

  return result.records[0]?.get('u').properties;
}

/**
 * Create a workspace entity
 *
 * @param workspace - Workspace data
 * @returns Created workspace node
 */
export async function createWorkspace(workspace: WorkspaceEntity) {
  const query = `
    MERGE (w:Workspace {id: $id})
    ON CREATE SET
      w.org_id = $org_id,
      w.name = $name,
      w.created_at = $created_at
    RETURN w
  `;

  const result = await writeQuery(query, {
    ...workspace,
    created_at: workspace.created_at || new Date().toISOString(),
  });

  return result.records[0]?.get('w').properties;
}

/**
 * Link a contact to a company
 *
 * @param contactEmail - Contact email
 * @param companyDomain - Company domain
 * @param workspaceId - Workspace ID
 */
export async function linkContactToCompany(
  contactEmail: string,
  companyDomain: string,
  workspaceId: string
) {
  const query = `
    MATCH (c:Contact {email: $contactEmail, workspace_id: $workspaceId})
    MATCH (co:Company {domain: $companyDomain})
    MERGE (c)-[r:WORKS_AT]->(co)
    ON CREATE SET r.created_at = datetime()
    RETURN r
  `;

  const result = await writeQuery(query, {
    contactEmail,
    companyDomain,
    workspaceId,
  });

  return result.records[0]?.get('r').properties;
}

/**
 * Create a connection between two contacts
 *
 * @param contact1Email - First contact email
 * @param contact2Email - Second contact email
 * @param workspaceId - Workspace ID
 * @param strength - Connection strength (0-1)
 */
export async function linkContacts(
  contact1Email: string,
  contact2Email: string,
  workspaceId: string,
  strength: number = 0.5
) {
  const query = `
    MATCH (c1:Contact {email: $contact1Email, workspace_id: $workspaceId})
    MATCH (c2:Contact {email: $contact2Email, workspace_id: $workspaceId})
    MERGE (c1)-[r:CONNECTED_TO]-(c2)
    ON CREATE SET
      r.strength = $strength,
      r.created_at = datetime(),
      r.interaction_count = 1
    ON MATCH SET
      r.interaction_count = r.interaction_count + 1,
      r.updated_at = datetime()
    RETURN r
  `;

  const result = await writeQuery(query, {
    contact1Email,
    contact2Email,
    workspaceId,
    strength,
  });

  return result.records[0]?.get('r').properties;
}

/**
 * Record an email open event
 *
 * @param emailId - Email ID
 * @param timestamp - Open timestamp
 */
export async function recordEmailOpen(emailId: string, timestamp: string) {
  const query = `
    MATCH (e:Email {id: $emailId})
    SET e.opened = true, e.opened_at = $timestamp
    RETURN e
  `;

  const result = await writeQuery(query, { emailId, timestamp });
  return result.records[0]?.get('e').properties;
}

/**
 * Record an email click event
 *
 * @param emailId - Email ID
 * @param url - Clicked URL
 * @param timestamp - Click timestamp
 */
export async function recordEmailClick(
  emailId: string,
  url: string,
  timestamp: string
) {
  const query = `
    MATCH (e:Email {id: $emailId})
    SET e.clicked = true, e.clicked_at = $timestamp
    WITH e
    MERGE (e)-[r:CLICKED {url: $url}]->(:URL {url: $url})
    ON CREATE SET r.timestamp = $timestamp, r.count = 1
    ON MATCH SET r.count = r.count + 1, r.last_clicked = $timestamp
    RETURN e, r
  `;

  const result = await writeQuery(query, { emailId, url, timestamp });
  return result.records[0]?.get('e').properties;
}

/**
 * Get contact with relationships
 *
 * @param email - Contact email
 * @param workspaceId - Workspace ID
 * @returns Contact with relationships
 */
export async function getContact(email: string, workspaceId: string) {
  const query = `
    MATCH (c:Contact {email: $email, workspace_id: $workspaceId})
    OPTIONAL MATCH (c)-[:WORKS_AT]->(co:Company)
    OPTIONAL MATCH (c)-[r:SENT|RECEIVED]->(e:Email)
    OPTIONAL MATCH (c)-[:CONNECTED_TO]-(other:Contact)
    RETURN c,
           co.name as company_name,
           COUNT(DISTINCT e) as email_count,
           COUNT(DISTINCT other) as connection_count,
           COLLECT(DISTINCT other.email)[0..5] as top_connections
  `;

  const result = await readQuery(query, { email, workspaceId });

  if (result.records.length === 0) {
    return null;
  }

  const record = result.records[0];
  return {
    ...record.get('c').properties,
    company_name: record.get('company_name'),
    email_count: record.get('email_count').toNumber(),
    connection_count: record.get('connection_count').toNumber(),
    top_connections: record.get('top_connections'),
  };
}

/**
 * Get contacts by workspace
 *
 * @param workspaceId - Workspace ID
 * @param limit - Maximum number of contacts (default: 100)
 * @returns Array of contacts
 */
export async function getContactsByWorkspace(workspaceId: string, limit: number = 100) {
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    OPTIONAL MATCH (c)-[:WORKS_AT]->(co:Company)
    RETURN c, co.name as company_name
    ORDER BY c.ai_score DESC, c.created_at DESC
    LIMIT $limit
  `;

  const result = await readQuery(query, { workspaceId, limit });

  return result.records.map((record) => ({
    ...record.get('c').properties,
    company_name: record.get('company_name'),
  }));
}

/**
 * Search contacts by name or email
 *
 * @param query - Search query
 * @param workspaceId - Workspace ID
 * @param limit - Maximum results (default: 20)
 * @returns Array of matching contacts
 */
export async function searchContacts(
  query: string,
  workspaceId: string,
  limit: number = 20
) {
  const cypherQuery = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    WHERE c.email CONTAINS $query OR c.name CONTAINS $query
    OPTIONAL MATCH (c)-[:WORKS_AT]->(co:Company)
    RETURN c, co.name as company_name
    ORDER BY c.ai_score DESC
    LIMIT $limit
  `;

  const result = await readQuery(cypherQuery, {
    query: query.toLowerCase(),
    workspaceId,
    limit,
  });

  return result.records.map((record) => ({
    ...record.get('c').properties,
    company_name: record.get('company_name'),
  }));
}

/**
 * Delete a contact and all relationships
 *
 * @param contactId - Contact ID
 * @param workspaceId - Workspace ID
 */
export async function deleteContact(contactId: string, workspaceId: string) {
  const query = `
    MATCH (c:Contact {id: $contactId, workspace_id: $workspaceId})
    DETACH DELETE c
  `;

  await writeQuery(query, { contactId, workspaceId });
}
