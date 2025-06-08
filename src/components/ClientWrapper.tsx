'use client';

import React, { ReactNode } from 'react';
import CookieConsentProvider from './compliance/CookieConsentProvider';
// import { ExperimentProvider } from './experiments/ExperimentProvider'; // Temporarily disabled

interface ClientWrapperProps {
  children: ReactNode;
}

/**
 * Client-side wrapper component that provides client-only functionality
 * This component is meant to be imported in the layout.tsx file
 */
export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <CookieConsentProvider>
      {/* <ExperimentProvider> - Temporarily disabled to fix console errors */}
        {children}
      {/* </ExperimentProvider> */}
    </CookieConsentProvider>
  );
}
