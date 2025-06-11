import React, { createContext, useContext } from 'react';
import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
if (typeof window !== 'undefined') {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '', {
    track_pageview: true,
    persistence: 'localStorage',
    api_host: '/analytics'
  });
}

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
  identifyUser: (userId: string, userProps?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  identifyUser: () => {}
});

export const AnalyticsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const trackEvent = (eventName: string, properties: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined') {
      mixpanel.track(eventName, properties);
    }
  };

  const identifyUser = (userId: string, userProps: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined') {
      mixpanel.identify(userId);
      mixpanel.people.set(userProps);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, identifyUser }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => useContext(AnalyticsContext);
