import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';


/**
 * Guardian Layout - Industrial Theme
 *
 * All Guardian routes render with the industrial design system activated.
 */
export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme="industrial">
      {children}
    </ThemeProvider>
  );
}
