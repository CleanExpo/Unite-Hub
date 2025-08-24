'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ measurementId }) => {
  if (!measurementId) {
    console.warn('Google Analytics Measurement ID is not configured');
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
};

export default GoogleAnalytics;

// Event tracking utility functions
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Conversion tracking
export const trackConversion = (
  conversionId: string,
  value?: number,
  currency: string = 'USD'
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: currency,
    });
  }
};

// Page view tracking (for client-side navigation)
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// E-commerce tracking
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  items?: Array<{
    id: string;
    name: string;
    category?: string;
    quantity?: number;
    price?: number;
  }>
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    });
  }
};

// Form submission tracking
export const trackFormSubmission = (formName: string, formId?: string) => {
  trackEvent('form_submit', 'engagement', formName);
};

// Click tracking
export const trackClick = (elementName: string, elementType: string) => {
  trackEvent('click', elementType, elementName);
};

// Search tracking
export const trackSearch = (searchTerm: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'search', {
      search_term: searchTerm,
    });
  }
};

// User engagement tracking
export const trackEngagement = (
  engagementType: string,
  engagementValue?: string
) => {
  trackEvent(engagementType, 'user_engagement', engagementValue);
};
