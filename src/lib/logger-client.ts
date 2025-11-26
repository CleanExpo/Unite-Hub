/**
 * Client-safe logger wrapper
 *
 * Provides a minimal, Node.js-dependency-free logger for client components.
 * All actual logging is done server-side via API calls.
 */

function isBrowser() {
  return typeof window !== 'undefined';
}

export function createClientLogger(context: { context?: string; route?: string } = {}) {
  const scope = context.context || context.route || 'unknown';

  return {
    info: (message: string, data?: any) => {
      if (isBrowser()) {
        console.log(`[${scope}] ${message}`, data);
      }
    },
    warn: (message: string, data?: any) => {
      if (isBrowser()) {
        console.warn(`[${scope}] ${message}`, data);
      }
    },
    error: (message: string, data?: any) => {
      if (isBrowser()) {
        console.error(`[${scope}] ${message}`, data);
      }
    },
    debug: (message: string, data?: any) => {
      if (isBrowser()) {
        console.debug(`[${scope}] ${message}`, data);
      }
    },
  };
}

// Export client-safe log object for backward compatibility
export const log = {
  info: (message: string, data?: any) => {
    if (isBrowser()) {
      console.log(`[client] ${message}`, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (isBrowser()) {
      console.warn(`[client] ${message}`, data);
    }
  },
  error: (message: string, data?: any) => {
    if (isBrowser()) {
      console.error(`[client] ${message}`, data);
    }
  },
  debug: (message: string, data?: any) => {
    if (isBrowser()) {
      console.debug(`[client] ${message}`, data);
    }
  },
};
