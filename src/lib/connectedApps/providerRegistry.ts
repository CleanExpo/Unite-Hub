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
};

// ============================================================================
// Service to Scope Mappings
// ============================================================================

const googleServiceScopes: Record<ProviderService, string[]> = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',
  ],
  google_calendar: ['https://www.googleapis.com/auth/calendar.readonly'],
  google_drive: ['https://www.googleapis.com/auth/drive.readonly'],
  // Microsoft services (not used for Google)
  outlook: [],
  microsoft_calendar: [],
  onedrive: [],
};

const microsoftServiceScopes: Record<ProviderService, string[]> = {
  outlook: [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.Send',
  ],
  microsoft_calendar: ['https://graph.microsoft.com/Calendars.Read'],
  onedrive: ['https://graph.microsoft.com/Files.Read'],
  // Google services (not used for Microsoft)
  gmail: [],
  google_calendar: [],
  google_drive: [],
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
    if (provider === 'google') {
      return googleServiceScopes[service] || [];
    } else if (provider === 'microsoft') {
      return microsoftServiceScopes[service] || [];
    }
    return [];
  }

  /**
   * Get all scopes for all services of a provider
   */
  getAllScopesForProvider(provider: OAuthProvider): string[] {
    const services = this.getProviderServices(provider);
    const scopeSet = new Set<string>();

    // Add base scopes
    if (provider === 'google') {
      scopeSet.add('openid');
      scopeSet.add('email');
      scopeSet.add('profile');
    } else if (provider === 'microsoft') {
      scopeSet.add('openid');
      scopeSet.add('email');
      scopeSet.add('profile');
      scopeSet.add('offline_access');
      scopeSet.add('https://graph.microsoft.com/User.Read');
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

    // Add base scopes
    if (provider === 'google') {
      scopeSet.add('openid');
      scopeSet.add('email');
      scopeSet.add('profile');
    } else if (provider === 'microsoft') {
      scopeSet.add('openid');
      scopeSet.add('email');
      scopeSet.add('profile');
      scopeSet.add('offline_access');
      scopeSet.add('https://graph.microsoft.com/User.Read');
    }

    // Add service-specific scopes
    for (const service of services) {
      const scopes = this.getScopesForService(provider, service);
      scopes.forEach((scope) => scopeSet.add(scope));
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
    const serviceInfo: Record<ProviderService, { name: string; icon: string }> = {
      gmail: { name: 'Gmail', icon: 'mail' },
      google_calendar: { name: 'Google Calendar', icon: 'calendar' },
      google_drive: { name: 'Google Drive', icon: 'hard-drive' },
      outlook: { name: 'Outlook', icon: 'mail' },
      microsoft_calendar: { name: 'Microsoft Calendar', icon: 'calendar' },
      onedrive: { name: 'OneDrive', icon: 'hard-drive' },
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
