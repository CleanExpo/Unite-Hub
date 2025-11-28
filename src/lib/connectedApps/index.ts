/**
 * Connected Apps Module
 *
 * Unified OAuth integration for Google Workspace and Microsoft 365.
 */

// Types
export type {
  OAuthProvider,
  ProviderService,
  ConnectionStatus,
  ProviderMetadata,
  OAuthTokens,
  EncryptedTokens,
  ConnectedApp,
  ConnectedAppWithServices,
  CreateConnectedAppInput,
  UpdateConnectedAppInput,
  OAuthState,
  GoogleUserInfo,
  MicrosoftUserInfo,
  ProviderUserInfo,
  TokenExchangeRequest,
  TokenExchangeResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
} from './providerTypes';

export { ConnectedAppsError, ErrorCodes } from './providerTypes';

// Services
export { getProviderRegistry, default as ProviderRegistry } from './providerRegistry';
export { getTokenVault, default as TokenVault } from './tokenVault';
export { getOAuthService, default as OAuthService } from './oauthService';
export {
  getConnectedAppsService,
  default as ConnectedAppsService,
} from './connectedAppsService';

// Backward-compatible singleton instances for consumers expecting direct imports
// These are lazy getters that return singleton instances

// Token vault singleton
let _tokenVault: InstanceType<typeof TokenVault> | null = null;
export const tokenVault = new Proxy({} as InstanceType<typeof TokenVault>, {
  get(_target, prop) {
    if (!_tokenVault) {
      const { getTokenVault: getTV } = require('./tokenVault');
      _tokenVault = getTV();
    }
    return (_tokenVault as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Connected apps service singleton
let _connectedAppsService: InstanceType<typeof ConnectedAppsService> | null = null;
export const connectedAppsService = new Proxy({} as InstanceType<typeof ConnectedAppsService>, {
  get(_target, prop) {
    if (!_connectedAppsService) {
      const { getConnectedAppsService: getCAS } = require('./connectedAppsService');
      _connectedAppsService = getCAS();
    }
    return (_connectedAppsService as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// OAuth service singleton
let _oauthService: InstanceType<typeof OAuthService> | null = null;
export const oauthService = new Proxy({} as InstanceType<typeof OAuthService>, {
  get(_target, prop) {
    if (!_oauthService) {
      const { getOAuthService: getOS } = require('./oauthService');
      _oauthService = getOS();
    }
    return (_oauthService as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Gmail and Outlook service stubs (these are now handled via connectedAppsService)
// These provide backwards compatibility for code expecting separate service instances
export const gmailService = {
  async getClient(connectedAppId: string) {
    const service = getConnectedAppsService();
    const app = await service.getConnectedApp(connectedAppId);
    if (app?.provider !== 'google') {
      throw new Error('Not a Google connected app');
    }
    return app;
  },
};

export const outlookService = {
  async getClient(connectedAppId: string) {
    const service = getConnectedAppsService();
    const app = await service.getConnectedApp(connectedAppId);
    if (app?.provider !== 'microsoft') {
      throw new Error('Not a Microsoft connected app');
    }
    return app;
  },
};
