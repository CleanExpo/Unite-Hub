/**
 * CDN Module
 * 
 * This is the main entry point for CDN functionality.
 * It exports all CDN-related configuration, utilities, and components.
 */

// Export configuration
export {
  CdnProvider,
  defaultCdnConfig,
  getCdnConfig,
  setCdnConfig,
  getCdnBaseUrl,
  shouldUseCdn,
  getCacheControl,
} from './config';
export type { CdnConfig } from './config';

// Export utilities
export {
  getCdnUrl,
  getCdnImageUrl,
  getCdnImageSrcSet,
  getCdnCacheHeaders,
  isCdnUrl,
  getAbsoluteUrl,
} from './utils';

// Export middleware
export {
  applyCdnHeaders,
  createCdnMiddleware,
  shouldRedirectToCdn,
  getCdnRedirectUrl,
} from './middleware';
export type { CdnHeadersOptions } from './middleware';

// Components are exported directly from their respective files
// Use: import { OptimizedImage } from '@/components/common/OptimizedImage';
