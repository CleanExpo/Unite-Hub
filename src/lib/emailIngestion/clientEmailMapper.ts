/**
 * Client Email Mapper
 *
 * Maps email addresses to CRM contacts using various heuristics:
 * - Exact email match
 * - Domain match
 * - Name similarity
 */

import { getSupabaseServer } from '@/lib/supabase';
import { emailIngestionConfig } from '@config/emailIngestion.config';

// ============================================================================
// Types
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  domain: string | null;
  workspaceId: string;
}

export interface EmailAddress {
  email: string;
  name: string;
}

export interface MappingResult {
  clientId: string | null;
  confidence: number;
  method: 'email_exact' | 'domain_match' | 'name_match' | 'manual' | 'none';
  matchedContact: Contact | null;
}

export interface BulkMappingResult {
  mappings: Map<string, MappingResult>;
  newContacts: Contact[];
}

// ============================================================================
// Client Email Mapper Class
// ============================================================================

class ClientEmailMapper {
  private contactCache: Map<string, Contact[]> = new Map();
  private domainCache: Map<string, Contact[]> = new Map();
  private cacheWorkspaceId: string | null = null;

  /**
   * Map a single email address to a CRM contact
   */
  async mapEmailToClient(
    workspaceId: string,
    emailAddress: EmailAddress
  ): Promise<MappingResult> {
    // Ensure cache is loaded
    await this.loadCache(workspaceId);

    const normalizedEmail = emailAddress.email.toLowerCase().trim();
    const domain = this.extractDomain(normalizedEmail);

    // 1. Try exact email match
    if (emailIngestionConfig.clientMapping.autoMapByEmail) {
      const contacts = this.contactCache.get(workspaceId) || [];
      const exactMatch = contacts.find(
        (c) => c.email?.toLowerCase() === normalizedEmail
      );

      if (exactMatch) {
        return {
          clientId: exactMatch.id,
          confidence: 1.0,
          method: 'email_exact',
          matchedContact: exactMatch,
        };
      }
    }

    // 2. Try domain match
    if (emailIngestionConfig.clientMapping.autoMapByDomain && domain) {
      const domainContacts = this.domainCache.get(domain) || [];

      if (domainContacts.length === 1) {
        // Only auto-match if there's exactly one contact with this domain
        return {
          clientId: domainContacts[0].id,
          confidence: 0.8,
          method: 'domain_match',
          matchedContact: domainContacts[0],
        };
      } else if (domainContacts.length > 1 && emailAddress.name) {
        // Multiple contacts with same domain - try name matching
        const nameMatch = this.findBestNameMatch(emailAddress.name, domainContacts);
        if (nameMatch) {
          return {
            clientId: nameMatch.contact.id,
            confidence: nameMatch.confidence,
            method: 'name_match',
            matchedContact: nameMatch.contact,
          };
        }
      }
    }

    // 3. No match found - optionally create new contact
    if (emailIngestionConfig.clientMapping.createUnmappedContacts) {
      const newContact = await this.createContact(
        workspaceId,
        emailAddress.email,
        emailAddress.name
      );

      if (newContact) {
        // Add to cache
        const contacts = this.contactCache.get(workspaceId) || [];
        contacts.push(newContact);
        this.contactCache.set(workspaceId, contacts);

        // Update domain cache
        if (domain) {
          const domainContacts = this.domainCache.get(domain) || [];
          domainContacts.push(newContact);
          this.domainCache.set(domain, domainContacts);
        }

        return {
          clientId: newContact.id,
          confidence: 0.6,
          method: 'email_exact', // Technically a new record
          matchedContact: newContact,
        };
      }
    }

    return {
      clientId: null,
      confidence: 0,
      method: 'none',
      matchedContact: null,
    };
  }

  /**
   * Map multiple email addresses to CRM contacts
   */
  async mapEmailsToClients(
    workspaceId: string,
    emailAddresses: EmailAddress[]
  ): Promise<BulkMappingResult> {
    await this.loadCache(workspaceId);

    const mappings = new Map<string, MappingResult>();
    const newContacts: Contact[] = [];

    // Deduplicate emails
    const uniqueEmails = new Map<string, EmailAddress>();
    for (const addr of emailAddresses) {
      const key = addr.email.toLowerCase().trim();
      if (!uniqueEmails.has(key)) {
        uniqueEmails.set(key, addr);
      }
    }

    // Map each unique email
    for (const [email, address] of uniqueEmails) {
      const result = await this.mapEmailToClient(workspaceId, address);
      mappings.set(email, result);

      if (
        result.matchedContact &&
        result.method === 'email_exact' &&
        result.confidence < 1.0
      ) {
        newContacts.push(result.matchedContact);
      }
    }

    return { mappings, newContacts };
  }

  /**
   * Get all contacts for a domain
   */
  async getContactsByDomain(
    workspaceId: string,
    domain: string
  ): Promise<Contact[]> {
    await this.loadCache(workspaceId);
    return this.domainCache.get(domain.toLowerCase()) || [];
  }

  /**
   * Manually link an email thread to a contact
   */
  async manuallyLinkThread(
    workspaceId: string,
    threadId: string,
    clientId: string
  ): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('email_threads')
      .update({
        client_id: clientId,
        client_mapping_confidence: 1.0,
        client_mapping_method: 'manual',
      })
      .eq('workspace_id', workspaceId)
      .eq('id', threadId);

    return !error;
  }

  /**
   * Load contacts cache for workspace
   */
  private async loadCache(workspaceId: string): Promise<void> {
    // Check if cache is already loaded for this workspace
    if (this.cacheWorkspaceId === workspaceId && this.contactCache.has(workspaceId)) {
      return;
    }

    const supabase = await getSupabaseServer();

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, name, email, company')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('[ClientEmailMapper] Failed to load contacts:', error);
      return;
    }

    // Build caches
    const contactList: Contact[] = (contacts || []).map((c) => ({
      id: c.id,
      name: c.name || '',
      email: c.email,
      company: c.company,
      domain: c.email ? this.extractDomain(c.email) : null,
      workspaceId,
    }));

    this.contactCache.set(workspaceId, contactList);
    this.cacheWorkspaceId = workspaceId;

    // Build domain cache
    this.domainCache.clear();
    for (const contact of contactList) {
      if (contact.domain) {
        const existing = this.domainCache.get(contact.domain) || [];
        existing.push(contact);
        this.domainCache.set(contact.domain, existing);
      }
    }
  }

  /**
   * Clear the cache (call when contacts are updated)
   */
  clearCache(): void {
    this.contactCache.clear();
    this.domainCache.clear();
    this.cacheWorkspaceId = null;
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string | null {
    const parts = email.split('@');
    if (parts.length !== 2) {
return null;
}

    const domain = parts[1].toLowerCase();

    // Skip common free email providers
    const freeProviders = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
      'mail.com',
    ];

    if (freeProviders.includes(domain)) {
      return null;
    }

    return domain;
  }

  /**
   * Find best name match among contacts
   */
  private findBestNameMatch(
    searchName: string,
    contacts: Contact[]
  ): { contact: Contact; confidence: number } | null {
    const normalizedSearch = this.normalizeName(searchName);
    let bestMatch: { contact: Contact; confidence: number } | null = null;

    for (const contact of contacts) {
      const normalizedContact = this.normalizeName(contact.name);
      const similarity = this.calculateNameSimilarity(
        normalizedSearch,
        normalizedContact
      );

      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = { contact, confidence: similarity * 0.85 }; // Reduce confidence for name matching
      }
    }

    return bestMatch;
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  /**
   * Calculate similarity between two names (Jaccard similarity on words)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = new Set(name1.split(/\s+/));
    const words2 = new Set(name2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) {
return 0;
}
    return intersection.size / union.size;
  }

  /**
   * Create a new contact from email address
   */
  private async createContact(
    workspaceId: string,
    email: string,
    name: string
  ): Promise<Contact | null> {
    const supabase = await getSupabaseServer();

    // Derive name from email if not provided
    const displayName =
      name || email.split('@')[0].replace(/[._]/g, ' ').trim();

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: workspaceId,
        email,
        name: displayName,
        status: emailIngestionConfig.clientMapping.unmappedContactStatus,
        source: 'email_import',
      })
      .select()
      .single();

    if (error) {
      console.error('[ClientEmailMapper] Failed to create contact:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      company: data.company,
      domain: this.extractDomain(email),
      workspaceId,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let mapperInstance: ClientEmailMapper | null = null;

export function getClientEmailMapper(): ClientEmailMapper {
  if (!mapperInstance) {
    mapperInstance = new ClientEmailMapper();
  }
  return mapperInstance;
}

export default ClientEmailMapper;
