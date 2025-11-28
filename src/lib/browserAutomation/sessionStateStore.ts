/**
 * Session State Store
 *
 * Manages browser session state persistence with encryption.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getSupabaseServer } from '@/lib/supabase';
import {
  BrowserSession,
  SessionStatus,
  BrowserCookie,
  SessionState,
  EncryptedState,
} from './browserTypes';
import { browserAutomationConfig } from '../../../config/browserAutomationBoost.config';

const ENCRYPTION_KEY = process.env.BROWSER_STATE_ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';

export interface CreateSessionOptions {
  name: string;
  targetUrl: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  userAgent?: string;
  userId?: string;
}

export interface UpdateStateOptions {
  cookies?: BrowserCookie[];
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  currentUrl?: string;
}

class SessionStateStore {
  private config = browserAutomationConfig.sessionPersistence;

  /**
   * Create a new browser session
   */
  async createSession(
    workspaceId: string,
    options: CreateSessionOptions
  ): Promise<BrowserSession> {
    const supabase = await getSupabaseServer();

    const { data: session, error } = await supabase
      .from('browser_sessions')
      .insert({
        workspace_id: workspaceId,
        user_id: options.userId,
        name: options.name,
        target_url: options.targetUrl,
        status: 'active' as SessionStatus,
        browser_type: options.browserType || 'chromium',
        viewport: options.viewport || { width: 1920, height: 1080 },
        user_agent: options.userAgent,
        state_encrypted: this.config.encryptState,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapSessionFromDb(session);
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<BrowserSession | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapSessionFromDb(data);
  }

  /**
   * Get active sessions for a workspace
   */
  async getActiveSessions(workspaceId: string): Promise<BrowserSession[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'paused'])
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapSessionFromDb.bind(this));
  }

  /**
   * Update session state
   */
  async updateState(
    sessionId: string,
    state: UpdateStateOptions
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const updates: Record<string, unknown> = {
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (state.currentUrl) {
      updates.current_url = state.currentUrl;
    }

    // Get current session to check encryption setting
    const { data: session } = await supabase
      .from('browser_sessions')
      .select('state_encrypted')
      .eq('id', sessionId)
      .single();

    const shouldEncrypt = session?.state_encrypted && this.config.encryptState;

    if (state.cookies) {
      updates.cookies = shouldEncrypt
        ? this.encrypt(JSON.stringify(state.cookies))
        : state.cookies;
    }

    if (state.localStorage) {
      updates.local_storage = shouldEncrypt
        ? this.encrypt(JSON.stringify(state.localStorage))
        : state.localStorage;
    }

    if (state.sessionStorage) {
      updates.session_storage = shouldEncrypt
        ? this.encrypt(JSON.stringify(state.sessionStorage))
        : state.sessionStorage;
    }

    const { error } = await supabase
      .from('browser_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get full session state (decrypted)
   */
  async getState(sessionId: string): Promise<SessionState | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_sessions')
      .select('cookies, local_storage, session_storage, current_url, viewport, state_encrypted')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    const shouldDecrypt = data.state_encrypted;

    return {
      cookies: shouldDecrypt && data.cookies
        ? JSON.parse(this.decrypt(data.cookies as EncryptedState))
        : (data.cookies as BrowserCookie[]) || [],
      localStorage: shouldDecrypt && data.local_storage
        ? JSON.parse(this.decrypt(data.local_storage as EncryptedState))
        : (data.local_storage as Record<string, string>) || {},
      sessionStorage: shouldDecrypt && data.session_storage
        ? JSON.parse(this.decrypt(data.session_storage as EncryptedState))
        : (data.session_storage as Record<string, string>) || {},
      currentUrl: data.current_url || '',
      viewport: data.viewport as { width: number; height: number } || { width: 1920, height: 1080 },
    };
  }

  /**
   * Update session status
   */
  async updateStatus(
    sessionId: string,
    status: SessionStatus,
    errorMessage?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (status === 'ended' || status === 'error') {
      updates.last_activity_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('browser_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<SessionState | null> {
    const state = await this.getState(sessionId);

    if (!state) {
      return null;
    }

    await this.updateStatus(sessionId, 'active');

    return state;
  }

  /**
   * Pause a session (save state for later)
   */
  async pauseSession(sessionId: string, state: SessionState): Promise<void> {
    await this.updateState(sessionId, state);
    await this.updateStatus(sessionId, 'paused');
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    await this.updateStatus(sessionId, 'ended');
  }

  /**
   * Delete old sessions
   */
  async cleanupOldSessions(workspaceId: string, maxAgeDays = 30): Promise<number> {
    const supabase = await getSupabaseServer();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const { data, error } = await supabase
      .from('browser_sessions')
      .delete()
      .eq('workspace_id', workspaceId)
      .in('status', ['ended', 'error'])
      .lt('updated_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Clone a session (for reuse)
   */
  async cloneSession(
    sessionId: string,
    newName: string
  ): Promise<BrowserSession> {
    const original = await this.getSession(sessionId);

    if (!original) {
      throw new Error('Session not found');
    }

    const state = await this.getState(sessionId);

    const supabase = await getSupabaseServer();

    const { data: cloned, error } = await supabase
      .from('browser_sessions')
      .insert({
        workspace_id: original.workspaceId,
        user_id: original.userId,
        name: newName,
        target_url: original.targetUrl,
        status: 'paused' as SessionStatus,
        browser_type: original.browserType,
        viewport: original.viewport,
        user_agent: original.userAgent,
        cookies: state?.cookies,
        local_storage: state?.localStorage,
        session_storage: state?.sessionStorage,
        current_url: state?.currentUrl,
        state_encrypted: original.stateEncrypted,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapSessionFromDb(cloned);
  }

  /**
   * Export session state
   */
  async exportState(sessionId: string): Promise<{
    session: BrowserSession;
    state: SessionState;
  } | null> {
    const session = await this.getSession(sessionId);
    const state = await this.getState(sessionId);

    if (!session || !state) {
      return null;
    }

    return { session, state };
  }

  /**
   * Import session state
   */
  async importState(
    workspaceId: string,
    name: string,
    targetUrl: string,
    state: SessionState
  ): Promise<BrowserSession> {
    const session = await this.createSession(workspaceId, {
      name,
      targetUrl,
    });

    await this.updateState(session.id, {
      cookies: state.cookies,
      localStorage: state.localStorage,
      sessionStorage: state.sessionStorage,
      currentUrl: state.currentUrl,
    });

    return session;
  }

  // Encryption helpers

  private encrypt(data: string): EncryptedState {
    if (!ENCRYPTION_KEY) {
      throw new Error('Encryption key not configured');
    }

    const iv = randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
    };
  }

  private decrypt(encrypted: EncryptedState): string {
    if (!ENCRYPTION_KEY) {
      throw new Error('Encryption key not configured');
    }

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private mapSessionFromDb(data: Record<string, unknown>): BrowserSession {
    return {
      id: data.id as string,
      workspaceId: data.workspace_id as string,
      userId: data.user_id as string | undefined,
      name: data.name as string,
      targetUrl: data.target_url as string,
      status: data.status as SessionStatus,
      browserType: data.browser_type as 'chromium' | 'firefox' | 'webkit',
      viewport: data.viewport as { width: number; height: number } | undefined,
      userAgent: data.user_agent as string | undefined,
      currentUrl: data.current_url as string | undefined,
      lastActivityAt: data.last_activity_at ? new Date(data.last_activity_at as string) : undefined,
      errorMessage: data.error_message as string | undefined,
      stateEncrypted: data.state_encrypted as boolean | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const sessionStateStore = new SessionStateStore();
