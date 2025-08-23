// Feature flags configuration
export const featureFlags = {
  // Development features
  debugMode: process.env.NODE_ENV === 'development',
  showDevTools: process.env.NODE_ENV === 'development',
  
  // Feature toggles
  enableDashboard: true,
  enableSEOSynthesizer: true,
  enableAnimations: true,
  enableAnalytics: process.env.NODE_ENV === 'production',
  
  // Experimental features
  enableAIFeatures: false,
  enableBetaFeatures: false,
  enableA11yMode: false,
  
  // Performance features
  enableLazyLoading: true,
  enableImageOptimization: true,
  enableCodeSplitting: true,
  
  // Utility function to check if a feature is enabled
  isEnabled: (flag: string): boolean => {
    return (featureFlags as any)[flag] ?? false;
  }
};

// Export default for backward compatibility
export default featureFlags;