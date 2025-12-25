/**
 * Simple logger utility
 */

export function createLogger(component: string) {
  return {
    info: (...args: any[]) => console.log(`[${component}]`, ...args),
    error: (...args: any[]) => console.error(`[${component}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${component}]`, ...args),
    debug: (...args: any[]) => console.debug(`[${component}]`, ...args),
  };
}
