/**
 * Custom Integrations Framework (Elite Tier)
 * Allows businesses to connect custom APIs, webhooks, and third-party services
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CustomIntegration {
  id: string;
  workspace_id: string;
  name: string;
  type: 'webhook' | 'rest_api' | 'oauth' | 'custom';
  config: {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    auth?: {
      type: 'bearer' | 'basic' | 'api_key' | 'oauth2';
      credentials?: Record<string, string>;
    };
    payload_template?: string;
    triggers?: string[]; // Events that trigger this integration
  };
  status: 'active' | 'paused' | 'error';
  last_executed?: string;
  error_message?: string;
}

export class CustomIntegrationFramework {
  /**
   * Create a new custom integration
   */
  async createIntegration(integration: Omit<CustomIntegration, 'id' | 'last_executed' | 'error_message'>): Promise<CustomIntegration> {
    const { data, error } = await supabase
      .from('custom_integrations')
      .insert(integration)
      .select()
      .single();

    if (error) {
throw error;
}
    return data;
  }

  /**
   * Execute a custom integration
   */
  async executeIntegration(integrationId: string, payload: any): Promise<any> {
    // Get integration config
    const { data: integration, error } = await supabase
      .from('custom_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
throw error;
}

    if (integration.status !== 'active') {
      throw new Error(`Integration is ${integration.status}`);
    }

    try {
      let response;

      switch (integration.type) {
        case 'webhook':
          response = await this.executeWebhook(integration, payload);
          break;

        case 'rest_api':
          response = await this.executeRestAPI(integration, payload);
          break;

        case 'oauth':
          response = await this.executeOAuth(integration, payload);
          break;

        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }

      // Update last executed
      await supabase
        .from('custom_integrations')
        .update({
          last_executed: new Date().toISOString(),
          error_message: null
        })
        .eq('id', integrationId);

      return response;

    } catch (error: any) {
      // Log error
      await supabase
        .from('custom_integrations')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', integrationId);

      throw error;
    }
  }

  /**
   * Execute webhook integration
   */
  private async executeWebhook(integration: CustomIntegration, payload: any): Promise<any> {
    if (!integration.config.url) {
      throw new Error('Webhook URL not configured');
    }

    const response = await axios.post(integration.config.url, payload, {
      headers: integration.config.headers || {},
      timeout: 30000 // 30 second timeout
    });

    return response.data;
  }

  /**
   * Execute REST API integration
   */
  private async executeRestAPI(integration: CustomIntegration, payload: any): Promise<any> {
    if (!integration.config.url) {
      throw new Error('API URL not configured');
    }

    const method = integration.config.method || 'POST';
    const headers = { ...integration.config.headers };

    // Add authentication
    if (integration.config.auth) {
      switch (integration.config.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${integration.config.auth.credentials?.token}`;
          break;

        case 'basic':
          const username = integration.config.auth.credentials?.username || '';
          const password = integration.config.auth.credentials?.password || '';
          const encoded = Buffer.from(`${username}:${password}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
          break;

        case 'api_key':
          const keyName = integration.config.auth.credentials?.key_name || 'X-API-Key';
          const keyValue = integration.config.auth.credentials?.key_value || '';
          headers[keyName] = keyValue;
          break;
      }
    }

    const response = await axios({
      method,
      url: integration.config.url,
      data: method !== 'GET' ? payload : undefined,
      params: method === 'GET' ? payload : undefined,
      headers,
      timeout: 30000
    });

    return response.data;
  }

  /**
   * Execute OAuth integration
   */
  private async executeOAuth(integration: CustomIntegration, payload: any): Promise<any> {
    // OAuth flow implementation
    throw new Error('OAuth integration not yet implemented');
  }

  /**
   * Get all integrations for a workspace
   */
  async getIntegrations(workspaceId: string): Promise<CustomIntegration[]> {
    const { data, error } = await supabase
      .from('custom_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
throw error;
}
    return data || [];
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(integrationId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('workspace_id', workspaceId);

    if (error) {
throw error;
}
  }

  /**
   * Test an integration
   */
  async testIntegration(integrationId: string): Promise<boolean> {
    try {
      await this.executeIntegration(integrationId, { test: true, timestamp: new Date().toISOString() });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const customIntegrationFramework = new CustomIntegrationFramework();
