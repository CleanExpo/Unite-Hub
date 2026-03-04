/**
 * AnalyticsScripts — Server Component
 * Injects Plausible, GA4, and Microsoft Clarity tracking scripts.
 *
 * Environment variables (set in .env.local):
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN  — e.g. "unite-group.in"
 *   NEXT_PUBLIC_GA4_ID            — e.g. "G-XXXXXXXXXX"
 *   NEXT_PUBLIC_CLARITY_ID        — e.g. "xxxxxxxxxx"
 *
 * UNI-1453
 */

import Script from 'next/script';

interface AnalyticsScriptsProps {
  plausibleDomain?: string;
  ga4Id?: string;
  clarityId?: string;
}

export function AnalyticsScripts({
  plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  ga4Id = process.env.NEXT_PUBLIC_GA4_ID,
  clarityId = process.env.NEXT_PUBLIC_CLARITY_ID,
}: AnalyticsScriptsProps = {}) {
  return (
    <>
      {/* Plausible Analytics — privacy-first, no cookies */}
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}

      {/* Google Analytics 4 */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `,
            }}
          />
        </>
      )}

      {/* Microsoft Clarity — heatmaps + session recordings */}
      {clarityId && (
        <Script
          id="clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
            `,
          }}
        />
      )}
    </>
  );
}
