/**
 * Provider Registry
 *
 * Registry of supported OAuth providers with their metadata and configurations.
 */

import type {
  OAuthProvider,
  ProviderMetadata,
  ProviderService,
} from './providerTypes';

// ============================================================================
// Provider Metadata Registry
// ============================================================================

const providerMetadata: Record<OAuthProvider, ProviderMetadata> = {
  google: {
    id: 'google',
    name: 'google',
    displayName: 'Google Workspace',
    icon: 'google',
    color: '#4285F4',
    services: ['gmail', 'google_calendar', 'google_drive'],
    description: 'Connect Gmail, Google Calendar, and Google Drive',
  },
  microsoft: {
    id: 'microsoft',
    name: 'microsoft',
    displayName: 'Microsoft 365',
    icon: 'microsoft',
    color: '#00A4EF',
    services: ['outlook', 'microsoft_calendar', 'onedrive'],
    description: 'Connect Outlook, Microsoft Calendar, and OneDrive',
  },
  meta: {
    id: 'meta',
    name: 'meta',
    displayName: 'Facebook & Instagram',
    icon: 'facebook',
    color: '#1877F2',
    services: ['facebook_pages', 'instagram'],
    description: 'Manage Facebook Pages and Instagram accounts',
  },
  linkedin: {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    services: ['linkedin_company'],
    description: 'Post to LinkedIn company pages',
  },
  reddit: {
    id: 'reddit',
    name: 'reddit',
    displayName: 'Reddit',
    icon: 'message-circle',
    color: '#FF4500',
    services: ['reddit_account'],
    description: 'Post and engage on Reddit',
  },
  youtube: {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    services: ['youtube_channel'],
    description: 'Manage YouTube channel comments',
  },
};

// ============================================================================
// Service to Scope Mappings
// ============================================================================

const serviceScopesByProvider: Partial<Record<OAuthProvider, Partial<Record<ProviderService, string[]>>>> = {
  google: {
    gmail: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.labels',
    ],
    google_calendar: ['https://www.googleapis.com/auth/calendar.readonly'],
    google_drive: ['https://www.googleapis.com/auth/drive.readonly'],
  },
  microsoft: {
    outlook: [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
    ],
    microsoft_calendar: ['https://graph.microsoft.com/Calendars.Read'],
    onedrive: ['https://graph.microsoft.com/Files.Read'],
  },
  meta: {
    facebook_pages: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_messaging'],
    instagram: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments'],
  },
  linkedin: {
    linkedin_company: ['w_member_social', 'r_organization_social', 'w_organization_social'],
  },
  reddit: {
    reddit_account: ['identity', 'read', 'submit', 'privatemessages'],
  },
  youtube: {
    youtube_channel: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ],
  },
};

// ============================================================================
// Provider Registry Class
// ============================================================================

class ProviderRegistry {
  /**
   * Get all supported providers
   */
  getAllProviders(): ProviderMetadata[] {
    return Object.values(providerMetadata);
  }

  /**
   * Get a specific provider's metadata
   */
  getProvider(provider: OAuthProvider): ProviderMetadata | undefined {
    return providerMetadata[provider];
  }

  /**
   * Check if a provider is supported
   */
  isProviderSupported(provider: string): provider is OAuthProvider {
    return provider in providerMetadata;
  }

  /**
   * Get services for a provider
   */
  getProviderServices(provider: OAuthProvider): ProviderService[] {
    return providerMetadata[provider]?.services || [];
  }

  /**
   * Get scopes required for a service
   */
  getScopesForService(provider: OAuthProvider, service: ProviderService): string[] {
    return serviceScopesByProvider[provider]?.[service] ?? [];
  }

  /**
   * Get all scopes for all services of a provider
   */
  getAllScopesForProvider(provider: OAuthProvider): string[] {
    const services = this.getProviderServices(provider);
    const scopeSet = new Set<string>();

    // Add base scopes (provider-specific)
    const baseScopes: Partial<Record<OAuthProvider, string[]>> = {
      google: ['openid', 'email', 'profile'],
      microsoft: ['openid', 'email', 'profile', 'offline_access', 'https://graph.microsoft.com/User.Read'],
      linkedin: ['openid', 'profile'],
      youtube: ['openid', 'email', 'profile'],
    };
    for (const scope of baseScopes[provider] ?? []) {
      scopeSet.add(scope);
    }

    // Add service-specific scopes
    for (const service of services) {
      const scopes = this.getScopesForService(provider, service);
      scopes.forEach((scope) => scopeSet.add(scope));
    }

    return Array.from(scopeSet);
  }

  /**
   * Get scopes for specific services
   */
  getScopesForServices(
    provider: OAuthProvider,
    services: ProviderService[]
  ): string[] {
    const scopeSet = new Set<string>();

    // Add base scopes from getAllScopesForProvider pattern
    const allScopes = this.getAllScopesForProvider(provider);
    const serviceScopes = new Set<string>();
    for (const service of services) {
      const scopes = this.getScopesForService(provider, service);
      scopes.forEach((scope) => serviceScopes.add(scope));
    }

    // Include base scopes + requested service scopes
    for (const scope of allScopes) {
      // Include base scopes (non-service scopes) always
      if (serviceScopes.has(scope)) {
        scopeSet.add(scope);
      }
    }

    return Array.from(scopeSet);
  }

  /**
   * Determine which services are enabled based on granted scopes
   */
  getActiveServices(
    provider: OAuthProvider,
    grantedScopes: string[]
  ): ProviderService[] {
    const services = this.getProviderServices(provider);
    const activeServices: ProviderService[] = [];

    for (const service of services) {
      const requiredScopes = this.getScopesForService(provider, service);
      // Check if all required scopes are granted
      const hasAllScopes = requiredScopes.every((scope) =>
        grantedScopes.some((granted) => granted.includes(scope) || scope.includes(granted))
      );
      if (hasAllScopes && requiredScopes.length > 0) {
        activeServices.push(service);
      }
    }

    return activeServices;
  }

  /**
   * Get display info for a service
   */
  getServiceDisplayInfo(service: ProviderService): { name: string; icon: string } {
    const serviceInfo: Record<string, { name: string; icon: string }> = {
      gmail: { name: 'Gmail', icon: 'mail' },
      google_calendar: { name: 'Google Calendar', icon: 'calendar' },
      google_drive: { name: 'Google Drive', icon: 'hard-drive' },
      outlook: { name: 'Outlook', icon: 'mail' },
      microsoft_calendar: { name: 'Microsoft Calendar', icon: 'calendar' },
      onedrive: { name: 'OneDrive', icon: 'hard-drive' },
      facebook_pages: { name: 'Facebook Pages', icon: 'facebook' },
      instagram: { name: 'Instagram', icon: 'instagram' },
      linkedin_company: { name: 'LinkedIn Company', icon: 'linkedin' },
      reddit_account: { name: 'Reddit', icon: 'message-circle' },
      youtube_channel: { name: 'YouTube', icon: 'youtube' },
    };
    return serviceInfo[service] || { name: service, icon: 'circle' };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let registryInstance: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
  }
  return registryInstance;
}

export default ProviderRegistry;
