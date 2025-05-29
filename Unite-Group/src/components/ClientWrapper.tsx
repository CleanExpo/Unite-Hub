'use client';

import React, { ReactNode } from 'react';
import CookieConsentProvider from './compliance/CookieConsentProvider';

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
      {children}
    </CookieConsentProvider>
  );
}
