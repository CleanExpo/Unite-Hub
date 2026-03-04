import { Footer } from '@/components/marketing/Footer';
import { CookieConsent } from '@/components/CookieConsent';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
      <CookieConsent />
    </>
  );
}
