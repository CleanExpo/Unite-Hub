/**
 * EntityGraphService
 * Phase 13 Week 1-2: Entity graph management for brand-level entity data
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type EntityType =
  | 'brand' | 'person' | 'product' | 'service' | 'location'
  | 'organization' | 'event' | 'article' | 'webpage';

export type LinkType =
  | 'sameAs' | 'subOrganizationOf' | 'memberOf' | 'owns'
  | 'produces' | 'locatedIn' | 'worksFor' | 'mentions'
  | 'related' | 'competitor' | 'partner';

export interface EntityGraph {
  id: string;
  org_id: string;
  workspace_id?: string;
  name: string;
  description?: string;
  domain?: string;
  node_count: number;
  link_count: number;
  config: any;
  created_at: string;
  updated_at: string;
}

export interface EntityNode {
  id: string;
  graph_id: string;
  entity_type: EntityType;
  name: string;
  canonical_url?: string;
  description?: string;
  short_description?: string;
  keywords?: string[];
  authority_score: number;
  relevance_score: number;
  freshness_score: number;
  external_ids?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface EntityLink {
  id: string;
  graph_id: string;
  source_node_id: string;
  target_node_id: string;
  link_type: LinkType;
  weight: number;
  bidirectional: boolean;
  metadata?: any;
  created_at: string;
}

export interface EntityAttribute {
  id: string;
  node_id: string;
  attribute_key: string;
  attribute_value: string;
  attribute_type: string;
  schema_property?: string;
  source?: string;
  confidence: number;
  created_at: string;
}

export interface ExtractedEntity {
  type: EntityType;
  name: string;
  url?: string;
  description?: string;
  attributes: { [key: string]: string };
  confidence: number;
}

export class EntityGraphService {
  /**
   * Create a new entity graph
   */
  async createGraph(
    orgId: string,
    name: string,
    options: {
      workspaceId?: string;
      description?: string;
      domain?: string;
      config?: any;
    } = {}
  ): Promise<EntityGraph> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_graph')
      .insert({
        org_id: orgId,
        workspace_id: options.workspaceId,
        name,
        description: options.description,
        domain: options.domain,
        config: options.config || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating graph:', error);
      throw new Error('Failed to create entity graph');
    }

    return data;
  }

  /**
   * Get graph by ID
   */
  async getGraph(graphId: string): Promise<EntityGraph | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_graph')
      .select('*')
      .eq('id', graphId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
return null;
}
      throw new Error('Failed to fetch graph');
    }

    return data;
  }

  /**
   * List graphs for organization
   */
  async listGraphs(orgId: string): Promise<EntityGraph[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_graph')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to list graphs');
    }

    return data || [];
  }

  /**
   * Create entity node
   */
  async createNode(
    graphId: string,
    entityType: EntityType,
    name: string,
    options: {
      canonicalUrl?: string;
      description?: string;
      shortDescription?: string;
      keywords?: string[];
      externalIds?: any;
      metadata?: any;
    } = {}
  ): Promise<EntityNode> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_nodes')
      .insert({
        graph_id: graphId,
        entity_type: entityType,
        name,
        canonical_url: options.canonicalUrl,
        description: options.description,
        short_description: options.shortDescription,
        keywords: options.keywords,
        external_ids: options.externalIds || {},
        metadata: options.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating node:', error);
      throw new Error('Failed to create entity node');
    }

    // Update graph node count
    await this.updateGraphCounts(graphId);

    return data;
  }

  /**
   * Get node by ID
   */
  async getNode(nodeId: string): Promise<EntityNode | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
return null;
}
      throw new Error('Failed to fetch node');
    }

    return data;
  }

  /**
   * Find nodes by name or URL
   */
  async findNodes(
    graphId: string,
    query: string,
    options: {
      entityType?: EntityType;
      limit?: number;
    } = {}
  ): Promise<EntityNode[]> {
    const supabase = await getSupabaseServer();

    let queryBuilder = supabase
      .from('entity_nodes')
      .select('*')
      .eq('graph_id', graphId)
      .or(`name.ilike.%${query}%,canonical_url.ilike.%${query}%`);

    if (options.entityType) {
      queryBuilder = queryBuilder.eq('entity_type', options.entityType);
    }

    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error('Failed to find nodes');
    }

    return data || [];
  }

  /**
   * Update node scores
   */
  async updateNodeScores(
    nodeId: string,
    scores: {
      authority?: number;
      relevance?: number;
      freshness?: number;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const updates: any = {};
    if (scores.authority !== undefined) {
updates.authority_score = scores.authority;
}
    if (scores.relevance !== undefined) {
updates.relevance_score = scores.relevance;
}
    if (scores.freshness !== undefined) {
updates.freshness_score = scores.freshness;
}

    const { error } = await supabase
      .from('entity_nodes')
      .update(updates)
      .eq('id', nodeId);

    if (error) {
      throw new Error('Failed to update node scores');
    }
  }

  /**
   * Create link between nodes
   */
  async createLink(
    graphId: string,
    sourceNodeId: string,
    targetNodeId: string,
    linkType: LinkType,
    options: {
      weight?: number;
      bidirectional?: boolean;
      metadata?: any;
    } = {}
  ): Promise<EntityLink> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_links')
      .insert({
        graph_id: graphId,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        link_type: linkType,
        weight: options.weight || 1.0,
        bidirectional: options.bidirectional || false,
        metadata: options.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating link:', error);
      throw new Error('Failed to create entity link');
    }

    // Update graph link count
    await this.updateGraphCounts(graphId);

    return data;
  }

  /**
   * Get links for a node
   */
  async getNodeLinks(
    nodeId: string,
    direction: 'outgoing' | 'incoming' | 'both' = 'both'
  ): Promise<EntityLink[]> {
    const supabase = await getSupabaseServer();

    let query;

    if (direction === 'outgoing') {
      query = supabase
        .from('entity_links')
        .select('*')
        .eq('source_node_id', nodeId);
    } else if (direction === 'incoming') {
      query = supabase
        .from('entity_links')
        .select('*')
        .eq('target_node_id', nodeId);
    } else {
      query = supabase
        .from('entity_links')
        .select('*')
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to get node links');
    }

    return data || [];
  }

  /**
   * Add attribute to node
   */
  async addAttribute(
    nodeId: string,
    key: string,
    value: string,
    options: {
      type?: string;
      schemaProperty?: string;
      source?: string;
      confidence?: number;
    } = {}
  ): Promise<EntityAttribute> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_attributes')
      .upsert({
        node_id: nodeId,
        attribute_key: key,
        attribute_value: value,
        attribute_type: options.type || 'string',
        schema_property: options.schemaProperty,
        source: options.source,
        confidence: options.confidence || 1.0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding attribute:', error);
      throw new Error('Failed to add attribute');
    }

    return data;
  }

  /**
   * Get all attributes for a node
   */
  async getNodeAttributes(nodeId: string): Promise<EntityAttribute[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('entity_attributes')
      .select('*')
      .eq('node_id', nodeId)
      .order('attribute_key');

    if (error) {
      throw new Error('Failed to get attributes');
    }

    return data || [];
  }

  /**
   * Extract entities from text content
   */
  extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // URL extraction
    const urlRegex = /https?:\/\/[^\s<>\"]+/g;
    const urls = content.match(urlRegex) || [];

    urls.forEach(url => {
      try {
        const urlObj = new URL(url);
        entities.push({
          type: 'webpage',
          name: urlObj.hostname,
          url,
          attributes: {
            domain: urlObj.hostname,
            path: urlObj.pathname,
          },
          confidence: 0.9,
        });
      } catch {
        // Invalid URL, skip
      }
    });

    // Email extraction
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = content.match(emailRegex) || [];

    emails.forEach(email => {
      const domain = email.split('@')[1];
      entities.push({
        type: 'organization',
        name: domain,
        attributes: {
          email,
          domain,
        },
        confidence: 0.7,
      });
    });

    // Phone extraction
    const phoneRegex = /\+?[\d\s-()]{10,}/g;
    const phones = content.match(phoneRegex) || [];

    phones.forEach(phone => {
      entities.push({
        type: 'organization',
        name: 'Phone Contact',
        attributes: {
          phone: phone.trim(),
        },
        confidence: 0.6,
      });
    });

    // Brand/Organization name patterns (capitalized words)
    const brandRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
    const brands = content.match(brandRegex) || [];

    brands.slice(0, 10).forEach(brand => {
      if (brand.length > 3) {
        entities.push({
          type: 'brand',
          name: brand,
          attributes: {},
          confidence: 0.5,
        });
      }
    });

    return entities;
  }

  /**
   * Build sameAs links for an entity
   */
  async buildSameAsLinks(
    graphId: string,
    nodeId: string,
    urls: string[]
  ): Promise<EntityLink[]> {
    const links: EntityLink[] = [];

    for (const url of urls) {
      // Create or find the target node
      let targetNode = await this.findNodes(graphId, url, { limit: 1 });

      if (targetNode.length === 0) {
        // Create new node for the URL
        const newNode = await this.createNode(graphId, 'webpage', url, {
          canonicalUrl: url,
        });
        targetNode = [newNode];
      }

      // Create sameAs link
      const link = await this.createLink(
        graphId,
        nodeId,
        targetNode[0].id,
        'sameAs',
        { bidirectional: true }
      );

      links.push(link);
    }

    return links;
  }

  /**
   * Get graph statistics
   */
  async getGraphStats(graphId: string): Promise<{
    nodeCount: number;
    linkCount: number;
    nodesByType: { [key: string]: number };
    linksByType: { [key: string]: number };
    avgAuthorityScore: number;
  }> {
    const supabase = await getSupabaseServer();

    // Get nodes
    const { data: nodes } = await supabase
      .from('entity_nodes')
      .select('entity_type, authority_score')
      .eq('graph_id', graphId);

    // Get links
    const { data: links } = await supabase
      .from('entity_links')
      .select('link_type')
      .eq('graph_id', graphId);

    const nodesByType: { [key: string]: number } = {};
    let totalAuthority = 0;

    (nodes || []).forEach((node: any) => {
      nodesByType[node.entity_type] = (nodesByType[node.entity_type] || 0) + 1;
      totalAuthority += node.authority_score || 0;
    });

    const linksByType: { [key: string]: number } = {};
    (links || []).forEach((link: any) => {
      linksByType[link.link_type] = (linksByType[link.link_type] || 0) + 1;
    });

    return {
      nodeCount: nodes?.length || 0,
      linkCount: links?.length || 0,
      nodesByType,
      linksByType,
      avgAuthorityScore: nodes?.length ? totalAuthority / nodes.length : 0,
    };
  }

  /**
   * Update graph node and link counts
   */
  private async updateGraphCounts(graphId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const stats = await this.getGraphStats(graphId);

    await supabase
      .from('entity_graph')
      .update({
        node_count: stats.nodeCount,
        link_count: stats.linkCount,
        last_updated: new Date().toISOString(),
      })
      .eq('id', graphId);
  }
}

// Export singleton
export const entityGraphService = new EntityGraphService();
