/**
 * Base service abstractions for build-time safety
 */

export { ServiceFactory, isConfigurable, isReconnectable } from './ServiceFactory';
export type { ConfigurableService, ReconnectableService } from './ServiceFactory';

export { RuntimeService, RuntimeOnly, isBuildTime, isTestEnvironment } from './RuntimeService';
