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
