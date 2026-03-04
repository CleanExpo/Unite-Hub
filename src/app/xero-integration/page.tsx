import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Xero Integration for Australian Businesses | Unite Group CRM',
  description:
    'Connect Xero to Unite Group CRM for automated bookkeeping, real-time financial data, and multi-entity reconciliation. Built for Australian SMEs.',
  keywords: ['xero integration', 'xero crm australia', 'xero automation', 'xero bookkeeping software'],
  alternates: { canonical: 'https://unite-group.in/xero-integration' },
  openGraph: {
    title: 'Xero Integration | Unite Group CRM',
    description: 'Automated Xero reconciliation for Australian businesses. Connect in under 2 minutes.',
    url: 'https://unite-group.in/xero-integration',
    siteName: 'Unite Group',
    type: 'website',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Unite Group Xero Integration',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'AUD',
    description: 'Included with Unite Group CRM subscription',
  },
  featureList: [
    'Real-time Xero data sync',
    'Multi-entity support (up to 6 businesses)',
    'Automated invoice reconciliation',
    'P&L dashboard integration',
    'GST reporting automation',
    'Bank reconciliation alerts',
  ],
  publisher: {
    '@type': 'Organization',
    name: 'Unite Group',
    url: 'https://unite-group.in',
  },
};

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-Time Sync',
    description:
      'Financial data flows instantly from Xero into your Unite Group dashboard — invoices, payments, and expenses all updated live.',
  },
  {
    icon: '🏢',
    title: 'Multi-Entity Support',
    description:
      'Manage up to 6 Xero organisations from one dashboard. Switch between Disaster Recovery, RestoreAssist, NRPG, and more with one click.',
  },
  {
    icon: '🤖',
    title: 'Automated Reconciliation',
    description:
      'AI-powered matching connects transactions to contacts. Reduce month-end reconciliation from days to minutes.',
  },
  {
    icon: '📊',
    title: 'P&L Dashboard',
    description:
      'Live profit and loss across all entities in a single view. Track revenue, expenses, and margins in real time.',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description:
      'Get notified instantly when invoices are overdue, payments received, or anomalies detected in your accounts.',
  },
  {
    icon: '🔒',
    title: 'Bank-Grade Security',
    description:
      'OAuth 2.0 connection, encrypted token storage with AES-256-GCM, and automatic token refresh. Your data stays private.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Connect Your Xero Account',
    desc: "Click \"Connect Xero\" and authorise Unite Group via Xero's secure OAuth flow. Takes under 60 seconds.",
  },
  {
    step: '02',
    title: 'Select Your Organisations',
    desc: 'Choose which Xero tenants to connect. Each maps to a business in your Unite Group dashboard.',
  },
  {
    step: '03',
    title: 'Data Flows Automatically',
    desc: 'Invoices, contacts, payments, and reports sync in real time. Your dashboard updates live.',
  },
];

export default function XeroIntegrationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen bg-[#050505] text-white">
        {/* Hero */}
        <section className="border-b border-[#1a1a1a] py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#00F5FF]/20 rounded-sm text-[#00F5FF] text-xs tracking-widest uppercase mb-8">
              OFFICIAL XERO INTEGRATION
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Connect Xero to Your{' '}
              <span className="text-[#00F5FF]">Australian Business</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Automated bookkeeping, real-time financial intelligence, and multi-entity management
              — built for Australian SMEs using Xero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/founder/integrations/xero"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-[#00F5FF] font-medium hover:bg-[#00F5FF]/20 transition-colors"
              >
                Connect Xero Free
              </a>
              <a
                href="/resources/ato-tax-guide"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#2a2a2a] rounded-sm text-zinc-400 font-medium hover:border-[#3a3a3a] hover:text-white transition-colors"
              >
                View ATO Tax Guide
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">Everything You Need from Xero</h2>
            <p className="text-zinc-500 text-center mb-12">
              Purpose-built for multi-entity Australian businesses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="border border-[#1a1a1a] rounded-sm p-6 bg-[#0a0a0a] hover:border-[#2a2a2a] transition-colors"
                >
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 border-b border-[#1a1a1a]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Up and Running in 3 Steps</h2>
            <div className="space-y-6">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  className="flex gap-6 border border-[#1a1a1a] rounded-sm p-6 bg-[#0a0a0a]"
                >
                  <div className="text-4xl font-bold text-[#00F5FF]/30 font-mono w-12 flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">{s.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Connect Xero?</h2>
            <p className="text-zinc-400 mb-8">
              Included with all Unite Group CRM plans. No extra charge. Connect in under 2 minutes.
            </p>
            <a
              href="/founder/integrations/xero"
              className="inline-flex items-center gap-2 px-10 py-4 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-sm text-[#00FF88] font-medium text-lg hover:bg-[#00FF88]/20 transition-colors"
            >
              Connect Xero Now — Free
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
