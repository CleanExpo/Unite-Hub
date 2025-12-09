/**
 * DOM Cache Service
 *
 * Caches DOM structure for faster element lookup and pattern matching.
 */

import { createHash } from 'crypto';
import { getSupabaseServer } from '@/lib/supabase';
import {
  DomMap,
  DomNode,
  InteractiveElement,
  FormInfo,
  FormField,
  LinkInfo,
  MediaElement,
} from './browserTypes';
import { browserAutomationConfig } from '../../../config/browserAutomationBoost.config';

export interface CaptureDomOptions {
  depth?: number;
  includeHidden?: boolean;
  includeStyles?: boolean;
}

export interface FindElementOptions {
  type?: InteractiveElement['type'][];
  text?: string;
  textContains?: string;
  hasAttribute?: string;
  attributeValue?: Record<string, string>;
  visible?: boolean;
}

class DomCacheService {
  private config = browserAutomationConfig.domCache;

  /**
   * Store a DOM snapshot
   */
  async storeDomMap(
    sessionId: string,
    workspaceId: string,
    url: string,
    domTree: DomNode,
    interactiveElements: InteractiveElement[],
    forms: FormInfo[],
    links: LinkInfo[],
    mediaElements: MediaElement[]
  ): Promise<DomMap> {
    const supabase = await getSupabaseServer();
    const urlHash = this.hashUrl(url);
    const expiresAt = new Date(Date.now() + this.config.maxAgeTTL * 1000);

    // Calculate approximate size
    const sizeBytes = this.calculateSize({
      domTree,
      interactiveElements,
      forms,
      links,
      mediaElements,
    });

    // Check if we need to update existing or create new
    const { data: existing } = await supabase
      .from('browser_dom_maps')
      .select('id')
      .eq('session_id', sessionId)
      .eq('url_hash', urlHash)
      .single();

    const mapData = {
      session_id: sessionId,
      workspace_id: workspaceId,
      url,
      url_hash: urlHash,
      dom_tree: domTree,
      interactive_elements: interactiveElements,
      forms,
      links,
      media_elements: mediaElements,
      captured_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      size_bytes: sizeBytes,
    };

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from('browser_dom_maps')
        .update(mapData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
throw error;
}
      result = data;
    } else {
      const { data, error } = await supabase
        .from('browser_dom_maps')
        .insert(mapData)
        .select()
        .single();

      if (error) {
throw error;
}
      result = data;
    }

    return this.mapDomMapFromDb(result);
  }

  /**
   * Get cached DOM map for a URL
   */
  async getDomMap(
    sessionId: string,
    url: string
  ): Promise<DomMap | null> {
    const supabase = await getSupabaseServer();
    const urlHash = this.hashUrl(url);

    const { data, error } = await supabase
      .from('browser_dom_maps')
      .select('*')
      .eq('session_id', sessionId)
      .eq('url_hash', urlHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDomMapFromDb(data);
  }

  /**
   * Find elements in cached DOM
   */
  async findElements(
    sessionId: string,
    url: string,
    options: FindElementOptions = {}
  ): Promise<InteractiveElement[]> {
    const domMap = await this.getDomMap(sessionId, url);

    if (!domMap) {
      return [];
    }

    let elements = domMap.interactiveElements;

    // Filter by type
    if (options.type?.length) {
      elements = elements.filter((e) => options.type!.includes(e.type));
    }

    // Filter by text
    if (options.text) {
      elements = elements.filter((e) =>
        e.text?.toLowerCase() === options.text!.toLowerCase() ||
        e.ariaLabel?.toLowerCase() === options.text!.toLowerCase()
      );
    }

    // Filter by text contains
    if (options.textContains) {
      const searchText = options.textContains.toLowerCase();
      elements = elements.filter((e) =>
        e.text?.toLowerCase().includes(searchText) ||
        e.ariaLabel?.toLowerCase().includes(searchText) ||
        e.placeholder?.toLowerCase().includes(searchText)
      );
    }

    // Filter by visibility
    if (options.visible !== undefined) {
      elements = elements.filter((e) => e.visible === options.visible);
    }

    return elements;
  }

  /**
   * Find forms in cached DOM
   */
  async findForms(sessionId: string, url: string): Promise<FormInfo[]> {
    const domMap = await this.getDomMap(sessionId, url);
    return domMap?.forms || [];
  }

  /**
   * Find a specific element by various selectors
   */
  async findElement(
    sessionId: string,
    url: string,
    selector: {
      xpath?: string;
      cssSelector?: string;
      text?: string;
      id?: string;
      name?: string;
      ariaLabel?: string;
    }
  ): Promise<InteractiveElement | null> {
    const domMap = await this.getDomMap(sessionId, url);

    if (!domMap) {
      return null;
    }

    const elements = domMap.interactiveElements;

    // Try each selector strategy in order of specificity
    if (selector.id) {
      const found = elements.find((e) => e.id === selector.id);
      if (found) {
return found;
}
    }

    if (selector.xpath) {
      const found = elements.find((e) => e.xpath === selector.xpath);
      if (found) {
return found;
}
    }

    if (selector.cssSelector) {
      const found = elements.find((e) => e.cssSelector === selector.cssSelector);
      if (found) {
return found;
}
    }

    if (selector.name) {
      const found = elements.find((e) => e.name === selector.name);
      if (found) {
return found;
}
    }

    if (selector.ariaLabel) {
      const found = elements.find((e) =>
        e.ariaLabel?.toLowerCase() === selector.ariaLabel!.toLowerCase()
      );
      if (found) {
return found;
}
    }

    if (selector.text) {
      const found = elements.find((e) =>
        e.text?.toLowerCase() === selector.text!.toLowerCase()
      );
      if (found) {
return found;
}
    }

    return null;
  }

  /**
   * Get links from cached DOM
   */
  async getLinks(
    sessionId: string,
    url: string,
    externalOnly = false
  ): Promise<LinkInfo[]> {
    const domMap = await this.getDomMap(sessionId, url);

    if (!domMap) {
      return [];
    }

    return externalOnly
      ? domMap.links.filter((l) => l.isExternal)
      : domMap.links;
  }

  /**
   * Get media elements from cached DOM
   */
  async getMediaElements(
    sessionId: string,
    url: string,
    type?: MediaElement['type']
  ): Promise<MediaElement[]> {
    const domMap = await this.getDomMap(sessionId, url);

    if (!domMap) {
      return [];
    }

    return type
      ? domMap.mediaElements.filter((m) => m.type === type)
      : domMap.mediaElements;
  }

  /**
   * Check if DOM cache is valid
   */
  async isCacheValid(sessionId: string, url: string): Promise<boolean> {
    const domMap = await this.getDomMap(sessionId, url);
    return domMap !== null;
  }

  /**
   * Invalidate DOM cache for a session
   */
  async invalidateCache(sessionId: string, url?: string): Promise<void> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('browser_dom_maps')
      .delete()
      .eq('session_id', sessionId);

    if (url) {
      query = query.eq('url_hash', this.hashUrl(url));
    }

    await query;
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupExpired(workspaceId: string): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_dom_maps')
      .delete()
      .eq('workspace_id', workspaceId)
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(workspaceId: string): Promise<{
    totalMaps: number;
    totalSizeBytes: number;
    avgSizeBytes: number;
    oldestCache: Date | null;
    newestCache: Date | null;
    expiredCount: number;
  }> {
    const supabase = await getSupabaseServer();

    const { data: maps } = await supabase
      .from('browser_dom_maps')
      .select('size_bytes, captured_at, expires_at')
      .eq('workspace_id', workspaceId);

    if (!maps || maps.length === 0) {
      return {
        totalMaps: 0,
        totalSizeBytes: 0,
        avgSizeBytes: 0,
        oldestCache: null,
        newestCache: null,
        expiredCount: 0,
      };
    }

    const now = new Date();
    const totalSizeBytes = maps.reduce((sum, m) => sum + (m.size_bytes || 0), 0);
    const dates = maps.map((m) => new Date(m.captured_at));
    const expiredCount = maps.filter((m) => new Date(m.expires_at) < now).length;

    return {
      totalMaps: maps.length,
      totalSizeBytes,
      avgSizeBytes: Math.round(totalSizeBytes / maps.length),
      oldestCache: new Date(Math.min(...dates.map((d) => d.getTime()))),
      newestCache: new Date(Math.max(...dates.map((d) => d.getTime()))),
      expiredCount,
    };
  }

  /**
   * Compare two DOM maps for changes
   */
  compareDomMaps(
    oldMap: DomMap,
    newMap: DomMap
  ): {
    addedElements: InteractiveElement[];
    removedElements: InteractiveElement[];
    changedElements: Array<{
      old: InteractiveElement;
      new: InteractiveElement;
      changes: string[];
    }>;
    addedForms: FormInfo[];
    removedForms: FormInfo[];
  } {
    const addedElements: InteractiveElement[] = [];
    const removedElements: InteractiveElement[] = [];
    const changedElements: Array<{
      old: InteractiveElement;
      new: InteractiveElement;
      changes: string[];
    }> = [];

    // Compare interactive elements by xpath
    const oldElementMap = new Map(oldMap.interactiveElements.map((e) => [e.xpath, e]));
    const newElementMap = new Map(newMap.interactiveElements.map((e) => [e.xpath, e]));

    for (const [xpath, newEl] of newElementMap) {
      const oldEl = oldElementMap.get(xpath);
      if (!oldEl) {
        addedElements.push(newEl);
      } else {
        const changes: string[] = [];
        if (oldEl.text !== newEl.text) {
changes.push('text');
}
        if (oldEl.visible !== newEl.visible) {
changes.push('visibility');
}
        if (oldEl.disabled !== newEl.disabled) {
changes.push('disabled');
}
        if (changes.length > 0) {
          changedElements.push({ old: oldEl, new: newEl, changes });
        }
      }
    }

    for (const [xpath, oldEl] of oldElementMap) {
      if (!newElementMap.has(xpath)) {
        removedElements.push(oldEl);
      }
    }

    // Compare forms
    const oldFormXpaths = new Set(oldMap.forms.map((f) => f.xpath));
    const newFormXpaths = new Set(newMap.forms.map((f) => f.xpath));

    const addedForms = newMap.forms.filter((f) => !oldFormXpaths.has(f.xpath));
    const removedForms = oldMap.forms.filter((f) => !newFormXpaths.has(f.xpath));

    return {
      addedElements,
      removedElements,
      changedElements,
      addedForms,
      removedForms,
    };
  }

  // Private helper methods

  private hashUrl(url: string): string {
    // Normalize URL before hashing (remove trailing slashes, lowercase)
    const normalized = url.toLowerCase().replace(/\/+$/, '');
    return createHash('sha256').update(normalized).digest('hex').substring(0, 32);
  }

  private calculateSize(data: object): number {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  private mapDomMapFromDb(data: Record<string, unknown>): DomMap {
    return {
      id: data.id as string,
      sessionId: data.session_id as string,
      workspaceId: data.workspace_id as string,
      url: data.url as string,
      urlHash: data.url_hash as string,
      domTree: data.dom_tree as DomNode,
      interactiveElements: data.interactive_elements as InteractiveElement[],
      forms: data.forms as FormInfo[],
      links: data.links as LinkInfo[],
      mediaElements: data.media_elements as MediaElement[],
      capturedAt: new Date(data.captured_at as string),
      expiresAt: new Date(data.expires_at as string),
      sizeBytes: data.size_bytes as number | undefined,
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const domCacheService = new DomCacheService();
