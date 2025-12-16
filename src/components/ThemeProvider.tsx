'use client';

import React, { useEffect } from 'react';
import { setTheme } from '@/lib/theme/useTheme';


interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: 'default' | 'industrial';
}

/**
 * ThemeProvider - Applies theme to layout and descendants
 *
 * Usage:
 * ```tsx
 * // In app/layout.tsx or a layout component:
 * <ThemeProvider theme="industrial">
 *   <YourApp />
 * </ThemeProvider>
 *
 * // Or for per-layout opt-in:
 * // app/guardian/layout.tsx
 * <ThemeProvider theme="industrial">
 *   <DashboardContent />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, theme = 'default' }: ThemeProviderProps) {
  useEffect(() => {
    setTheme(theme);

    // Cleanup on unmount or theme change
    return () => {
      // Optionally reset to default on unmount
      // setTheme('default');
    };
  }, [theme]);

  return <>{children}</>;
}
