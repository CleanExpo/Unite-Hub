import React from 'react';
import { DefaultErrorBoundary } from './DefaultErrorBoundary.jsx';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

export const AuthErrorBoundary: React.FC<AuthErrorBoundaryProps> = ({ children }) => {
  const fallback = (
    <div className="auth-error-boundary p-4 border border-yellow-500 rounded-lg bg-yellow-50">
      <h2 className="text-xl font-bold text-yellow-700 mb-2">Authentication Error</h2>
      <p className="text-yellow-600 mb-4">
        There was a problem with the authentication service. Please try refreshing the page or contact support if the issue persists.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  );

  return (
    <DefaultErrorBoundary fallback={fallback}>
      {children}
    </DefaultErrorBoundary>
  );
}; 