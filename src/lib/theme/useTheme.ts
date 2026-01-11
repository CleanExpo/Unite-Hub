/**
 * Theme Switching Utilities
 *
 * Provides client-side theme management for industrial design system
 * Theme is stored in document.documentElement.dataset.theme
 * No persistence layer - theme resets on page reload unless explicitly managed
 */

/**
 * Set the active theme for the current document
 * @param theme - Theme name ('default' or 'industrial')
 */
export function setTheme(theme: 'default' | 'industrial'): void {
  if (typeof document !== 'undefined') {
    if (theme === 'industrial') {
      document.documentElement.dataset.theme = 'industrial';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }
}

/**
 * Get the current active theme
 * @returns Current theme ('default' or 'industrial')
 */
export function getTheme(): 'default' | 'industrial' {
  if (typeof document !== 'undefined') {
    return document.documentElement.dataset.theme === 'industrial'
      ? 'industrial'
      : 'default';
  }
  return 'default';
}

/**
 * Toggle between default and industrial themes
 */
export function toggleTheme(): void {
  const current = getTheme();
  setTheme(current === 'industrial' ? 'default' : 'industrial');
}

/**
 * React hook for theme management
 * @returns Object with current theme and setTheme function
 */
export function useTheme() {
  return {
    theme: getTheme(),
    setTheme,
    toggleTheme,
  };
}
