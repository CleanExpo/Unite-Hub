/**
 * ATO Tax Guide — UNI-800/799/798/801
 * "ATO Tax Optimizer — R&D Tax Incentive Guide 2025-26"
 *
 * Targets:
 *   "R&D tax incentive Australia 2025-26"
 *   "AusIndustry R&D registration"
 *   "Division 7A compliance Xero"
 *   "forensic tax audit Xero Australia"
 *   "how to claim R&D tax incentive Australia"
 *
 * Schemas: Article + FAQPage (UNI-798) + HowTo (UNI-801)
 * Component: AtoSchemas (UNI-799)
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { AtoSchemas } from '@/components/seo/AtoSchemas';
import faqSchema from '@/content/seo/ato-faq-schema.json';
import howToSchema from '@/content/seo/ato-howto-schema.json';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'ATO R&D Tax Incentive Guide Australia 2025-26 | Unite-Group',
  description:
    "Complete guide to claiming Australia's R&D Tax Incentive. Eligible SMEs recover a 43.5% refundable tax offset via AusIndustry registration. Includes Division 7A and FBT optimisation.",
  keywords: [
    'r&d tax incentive australia',
    'AusIndustry registration',
    'tax recovery australia',
    'Division 7A compliance',
    'forensic tax audit Xero',
    'FBT optimisation australia',
    'ATO tax optimizer',
    'xero tax analysis',
    'unclaimed tax deductions australia',
    'R&D tax offset 2025-26',
  ],
  alternates: {
    canonical: 'https://unite-group.in/resources/ato-tax-guide',
  },
  openGraph: {
    title: 'ATO R&D Tax Incentive Guide Australia 2025-26',
    description:
      "Recover $200K–$500K in missed Australian tax benefits. Complete guide to R&D Tax Incentive, Division 7A, and FBT optimisation via forensic Xero analysis.",
    url: 'https://unite-group.in/resources/ato-tax-guide',
    type: 'article',
    publishedTime: '2026-03-04',
    modifiedTime: new Date().toISOString(),
    authors: ['https://unite-group.in/about'],
    locale: 'en_AU',
  },
};

// ─── Article Schema ────────────────────────────────────────────────────────────

function ArticleSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': 'https://unite-group.in/resources/ato-tax-guide',
    headline: 'ATO Tax Optimizer — R&D Tax Incentive Guide Australia 2025-26',
    description:
      "Complete guide to claiming Australia's R&D Tax Incentive. Eligible SMEs recover a 43.5% refundable tax offset via AusIndustry registration.",
    datePublished: '2026-03-04',
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: 'Unite Group',
      url: 'https://unite-group.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Unite Group',
      url: 'https://unite-group.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://unite-group.in/logos/unite-group-logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://unite-group.in/resources/ato-tax-guide',
    },
    about: {
      '@type': 'Thing',
      name: 'R&D Tax Incentive and Division 7A Compliance for Australian SMEs',
    },
    keywords:
      'R&D tax incentive Australia, AusIndustry registration, Division 7A compliance, FBT optimisation, forensic Xero analysis',
    inLanguage: 'en-AU',
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Section Components ────────────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl sm:text-3xl font-bold text-white mt-14 mb-4 scroll-mt-8">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold text-[#00F5FF] mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

function InfoCard({
  title,
  body,
  accent = false,
}: {
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border rounded-sm p-5 ${
        accent
          ? 'bg-[#00F5FF]/5 border-[#00F5FF]/20'
          : 'bg-zinc-900/60 border-zinc-700'
      }`}
    >
      <h4 className={`text-sm font-semibold mb-2 ${accent ? 'text-[#00F5FF]' : 'text-white'}`}>
        {title}
      </h4>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-700 rounded-sm p-5 text-center">
      <div className="text-3xl font-bold text-[#00FF88] mb-1">{value}</div>
      <div className="text-sm text-zinc-300 font-medium">{label}</div>
    </div>
  );
}

function LegislationBadge({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block text-xs font-mono bg-zinc-800 border border-zinc-700 text-[#00F5FF] rounded-sm px-2 py-0.5 mr-1 mb-1">
      {children}
    </code>
  );
}

// ─── Table of Contents ─────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { id: 'hero-stats', label: '1. Tax recovery opportunity' },
  { id: 'rd-tax-incentive', label: '2. R&D Tax Incentive overview' },
  { id: 'eligibility', label: '3. Eligibility criteria' },
  { id: 'ato-optimizer', label: '4. How ATO Tax Optimizer automates this' },
  { id: 'division-7a', label: '5. Division 7A compliance' },
  { id: 'fbt', label: '6. FBT optimisation strategies' },
  { id: 'howto', label: '7. How to run a forensic audit' },
  { id: 'faq', label: '8. Frequently asked questions' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtoTaxGuidePage() {
  return (
    <>
      {/* JSON-LD: Article */}
      <ArticleSchema />

      {/* JSON-LD: SoftwareApplication + FinancialProduct + Organization + FAQPage + HowTo */}
      <AtoSchemas
        includeFaq
        faqSchema={faqSchema}
        includeHowTo
        howToSchema={howToSchema}
      />

      <div className="min-h-screen bg-[#050505] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8">
            <Link href="/" className="hover:text-zinc-300">Home</Link>
            <span>/</span>
            <Link href="/resources" className="hover:text-zinc-300">Resources</Link>
            <span>/</span>
            <span className="text-zinc-400">ATO Tax Guide</span>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm px-3 py-1 mb-4">
              Updated March 2026 — FY 2025-26
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              ATO Tax Optimizer — R&D Tax Incentive Guide 2025-26
            </h1>
            <p className="text-lg text-zinc-300 leading-relaxed mb-6">
              Recover $200K–$500K in missed Australian tax benefits. Complete guide to claiming
              the R&D Tax Incentive, navigating Division 7A compliance, and maximising FBT
              exemptions — powered by forensic Xero analysis.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
              <span>By <span className="text-zinc-300">Unite Group</span></span>
              <span>·</span>
              <span>~20 min read</span>
              <span>·</span>
              <span>Last updated 4 March 2026 (AEST)</span>
            </div>
          </header>

          {/* Stats bar */}
          <div id="hero-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            <StatCard value="43.5%" label="Refundable R&D tax offset (SMEs under $20M turnover)" />
            <StatCard value="$20K" label="Minimum R&D expenditure threshold" />
            <StatCard value="$500K" label="Avg. recovery via forensic Xero analysis" />
            <StatCard value="60s" label="Xero OAuth connection time" />
          </div>

          {/* Legislation badges */}
          <div className="mb-8">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Relevant legislation</p>
            <div className="flex flex-wrap gap-1">
              <LegislationBadge>ITAA 1997 — Div 355 (R&D)</LegislationBadge>
              <LegislationBadge>ITAA 1936 — Div 7A</LegislationBadge>
              <LegislationBadge>FBTAA 1986</LegislationBadge>
              <LegislationBadge>Tax Laws Amendment (Research and Development) Act 2011</LegislationBadge>
              <LegislationBadge>ITAA 1997 — Subdiv 36-A (carry-forward losses)</LegislationBadge>
            </div>
          </div>

          {/* Table of contents */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-6 mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Table of Contents
            </h2>
            <ol className="space-y-2">
              {TOC_ITEMS.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm text-[#00F5FF] hover:text-[#00F5FF]/70"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Section 1: R&D Tax Incentive ── */}
          <SectionHeading id="rd-tax-incentive">2. What is the R&D Tax Incentive?</SectionHeading>
          <P>
            The <strong className="text-white">R&D Tax Incentive (RDTI)</strong> is a federal
            government programme that offsets the cost of eligible research and development
            activities in Australia. It is administered jointly by AusIndustry (Department of
            Industry) and the ATO under Division 355 of the Income Tax Assessment Act 1997 (ITAA
            1997).
          </P>
          <P>
            For eligible companies with an aggregated turnover under $20 million, the RDTI provides
            a <strong className="text-[#00FF88]">43.5% refundable tax offset</strong> on eligible
            R&D expenditure — meaning cash is returned to the company even if it is in a tax loss
            position. Larger companies (turnover $20M+) receive a non-refundable offset based on
            their tax rate plus 8.5–16.5 percentage points.
          </P>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <InfoCard
              accent
              title="Refundable offset (SMEs under $20M)"
              body="43.5% refundable tax offset on eligible R&D expenditure. Cash is returned even if the company is in a tax loss position. This is one of the most generous R&D incentives in the OECD."
            />
            <InfoCard
              title="Non-refundable offset (turnover $20M+)"
              body="Tax rate + 8.5% premium (for expenditure up to $150M) or tax rate + 16.5% premium (for $150M+). Cannot generate a refund — reduces tax liability only."
            />
          </div>

          <H3>What qualifies as eligible R&D?</H3>
          <P>
            Eligible R&D activities fall into two categories under Division 355:
          </P>
          <ul className="space-y-2 mb-6 ml-4">
            {[
              'Core R&D activities — experimental activities with a hypothesis, systematic investigation, and genuine uncertainty about technical outcomes',
              'Supporting R&D activities — activities directly supporting core R&D (e.g., software development, prototyping, testing)',
              'Eligible expenditure — salaries, contractor fees, materials, overhead directly attributable to R&D activities',
              'Notional deductions — decline in value of assets used exclusively for R&D',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                <span className="text-[#00F5FF] mt-0.5 flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>

          {/* ── Section 2: Eligibility ── */}
          <SectionHeading id="eligibility">3. Eligibility criteria</SectionHeading>
          <P>
            To claim the RDTI, your company must meet all of the following criteria:
          </P>
          <div className="space-y-3 mb-6">
            {[
              { n: '01', title: 'Incorporated in Australia', body: 'The company must be incorporated under Australian law or a foreign company that is an Australian resident for tax purposes.' },
              { n: '02', title: 'Minimum $20,000 in eligible expenditure', body: 'Total eligible R&D expenditure for the income year must be at least $20,000. Expenditure below this threshold does not qualify unless the company uses a registered R&D entity as a contractor.' },
              { n: '03', title: 'AusIndustry registration', body: 'R&D activities must be registered with AusIndustry. The registration deadline is 10 months after the end of your income year (e.g., 30 April 2026 for FY 2024-25). Late registration is not accepted.' },
              { n: '04', title: 'Tax return lodgement', body: 'Claim the offset in your company tax return by completing Schedule 8 (Research and Development Tax Incentive). The offset reduces your income tax liability (or generates a refund for eligible SMEs).' },
            ].map(item => (
              <div key={item.n} className="flex gap-4 bg-zinc-900/60 border border-zinc-700 rounded-sm p-4">
                <span className="flex-shrink-0 text-2xl font-black text-[#00F5FF]/30">
                  {item.n}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Section 3: ATO Tax Optimizer ── */}
          <SectionHeading id="ato-optimizer">4. How ATO Tax Optimizer automates this</SectionHeading>
          <P>
            Manually identifying eligible R&D activities, quantifying expenditure, and preparing
            AusIndustry registration documentation is time-consuming — typically 40–80 hours of
            accountant time per claim. ATO Tax Optimizer automates the analysis phase using
            forensic Xero data processing.
          </P>

          <div className="bg-[#00F5FF]/5 border border-[#00F5FF]/20 rounded-sm p-6 mb-6">
            <h4 className="font-semibold text-[#00F5FF] mb-3">
              How it works — Xero → AI → Report
            </h4>
            <ol className="space-y-3">
              {[
                { step: '1', text: 'Connect Xero via read-only OAuth 2.0 — takes under 60 seconds. No data is modified.' },
                { step: '2', text: 'AI analyses your chart of accounts, transactions, payroll, and project codes for R&D activity signals.' },
                { step: '3', text: 'The platform maps identified activities against Division 355 eligibility criteria and quantifies eligible expenditure.' },
                { step: '4', text: 'A report is generated showing estimated R&D offset value, AusIndustry registration requirements, and recommended actions.' },
                { step: '5', text: 'Export PDF or Excel — pre-formatted for your accountant or tax agent, with legislative references included.' },
              ].map(item => (
                <li key={item.step} className="flex gap-3 text-sm text-zinc-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#00F5FF] text-[#050505] text-xs font-bold rounded-sm flex items-center justify-center">
                    {item.step}
                  </span>
                  {item.text}
                </li>
              ))}
            </ol>
          </div>

          <P>
            Beyond R&D, ATO Tax Optimizer also scans for Division 7A exposure, FBT
            over-payments, carry-forward tax losses under Subdivision 36-A of the ITAA 1997,
            and GST reconciliation discrepancies — giving a complete picture of missed tax
            benefits in a single analysis run.
          </P>

          {/* ── Section 4: Division 7A ── */}
          <SectionHeading id="division-7a">5. Division 7A — what it is and how to stay compliant</SectionHeading>
          <P>
            <strong className="text-white">Division 7A</strong> of the Income Tax Assessment Act
            1936 (ITAA 1936) is one of the most commonly misunderstood — and misapplied — rules
            in Australian small business tax.
          </P>
          <P>
            Division 7A prevents private companies from making tax-free distributions to
            shareholders or their associates through loans, payments, or debt forgiveness that are
            not properly documented or treated as dividends. When triggered, the amount is deemed
            an unfranked dividend — fully taxable in the hands of the shareholder, with no
            deduction for the company.
          </P>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              {
                title: 'Triggering events',
                items: [
                  'Loans from a company to a shareholder',
                  'Payments made to a shareholder (not wages)',
                  'Use of company assets by a shareholder',
                  'Debt forgiveness on existing shareholder loans',
                ],
              },
              {
                title: 'How to avoid Div 7A issues',
                items: [
                  'Implement a complying loan agreement (minimum interest rate, 7-year maximum term)',
                  'Ensure loans are documented before tax return lodgement deadline',
                  'Review Xero for uncleared director loan accounts',
                  'Structure trust distributions correctly to avoid deemed dividends',
                ],
              },
            ].map(card => (
              <div key={card.title} className="bg-zinc-900/60 border border-zinc-700 rounded-sm p-5">
                <h4 className="text-sm font-semibold text-white mb-3">{card.title}</h4>
                <ul className="space-y-2">
                  {card.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                      <span className="text-[#FFB800] mt-0.5 flex-shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <P>
            ATO Tax Optimizer automatically identifies Division 7A exposure in your Xero data —
            flagging uncleared director loan accounts, undocumented shareholder payments, and
            trust distributions that may trigger deemed dividend rules. Each finding is
            accompanied by the relevant section reference and a recommended remediation action.
          </P>

          {/* ── Section 5: FBT ── */}
          <SectionHeading id="fbt">6. FBT optimisation strategies</SectionHeading>
          <P>
            <strong className="text-white">Fringe Benefits Tax (FBT)</strong> is levied on
            employers for non-cash benefits provided to employees and their associates. It operates
            on a separate 1 April–31 March tax year at a flat rate of 47% (aligned with the top
            marginal income tax rate + Medicare levy).
          </P>
          <P>
            Many Australian businesses over-pay FBT by failing to claim available exemptions,
            reductions, and employee contributions. The most common optimisation opportunities
            identified by ATO Tax Optimizer include:
          </P>

          <div className="space-y-3 mb-6">
            {[
              {
                title: 'Portable electronic device exemption',
                body: 'Laptops, tablets, and mobile phones provided primarily for work use are exempt from FBT. Many businesses misclassify these as taxable benefits. Under s 58X of the FBTAA 1986, one exempt device per employee per FBT year per category.',
                saving: 'Up to $2,000/employee/year',
              },
              {
                title: 'Employee contributions',
                body: 'When employees make after-tax contributions towards a benefit, the taxable value of the fringe benefit is reduced dollar-for-dollar. For car benefits, this includes fuel, registration, and maintenance payments made by the employee.',
                saving: 'Varies — typically 20–40% reduction',
              },
              {
                title: 'Work-related items',
                body: 'Tools of the trade, briefcases, computer software, protective clothing, and professional subscriptions provided primarily for work are exempt under s 58P of the FBTAA 1986.',
                saving: 'Typically $500–$5,000/year',
              },
              {
                title: 'Minor benefits exemption',
                body: 'Benefits with a notional taxable value under $300 that are provided infrequently and irregularly are exempt. Commonly missed for ad-hoc meals, gifts, and entertainment below the threshold.',
                saving: 'Up to $300 per benefit',
              },
            ].map(item => (
              <div key={item.title} className="border-l-2 border-[#00F5FF]/40 pl-4 py-1">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <span className="flex-shrink-0 text-xs font-semibold text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-sm px-2 py-0.5">
                    {item.saving}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* ── Section 6: HowTo ── */}
          <SectionHeading id="howto">7. How to run a forensic audit with ATO Tax Optimizer</SectionHeading>
          <P>
            A full forensic tax audit via ATO Tax Optimizer takes approximately 30 minutes from
            account creation to exported report.
          </P>

          <div className="space-y-3 mb-8">
            {[
              { n: 1, title: 'Create your free account', body: 'Sign up at ato-ai.app — the free trial includes one full forensic analysis run. No credit card required.' },
              { n: 2, title: 'Connect Xero via OAuth 2.0', body: "Click 'Connect Xero' and authorise read-only access in your Xero account. Takes under 60 seconds. ATO Tax Optimizer cannot modify, create, or delete Xero records." },
              { n: 3, title: 'Select your financial year', body: 'Choose FY 2023-24 or FY 2024-25. The platform pulls all relevant transactions, payroll data, chart of accounts, and GST history for the selected period.' },
              { n: 4, title: 'Choose analysis modules', body: 'Select from: R&D Tax Incentive, Division 7A compliance, FBT optimisation, and unclaimed deductions. Run all four for a complete forensic picture.' },
              { n: 5, title: 'Review AI findings', body: 'Findings are generated in 5–10 minutes. Each finding includes: the relevant tax legislation reference, estimated recovery amount, risk level, and recommended action.' },
              { n: 6, title: 'Export your report', body: 'Download PDF or Excel — pre-formatted for your accountant or registered tax agent. Reports include full legislative references (ITAA 1997, ITAA 1936, FBTAA 1986) and recommended next steps.' },
            ].map(step => (
              <div key={step.n} className="flex gap-4 bg-zinc-900/60 border border-zinc-700 rounded-sm p-4">
                <span className="flex-shrink-0 w-8 h-8 bg-[#00F5FF] text-[#050505] font-black text-sm rounded-sm flex items-center justify-center">
                  {step.n}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Section 7: FAQ ── */}
          <SectionHeading id="faq">8. Frequently asked questions</SectionHeading>

          <div className="space-y-4 mb-10">
            {[
              {
                q: 'How do I claim the R&D Tax Incentive in Australia for 2025-26?',
                a: "To claim Australia's R&D Tax Incentive for 2025-26: register your R&D activities with AusIndustry before 10 months after your income year ends, ensure minimum $20,000 in eligible R&D expenditure, and lodge your tax return with Schedule 8. Eligible companies with turnover under $20M can claim a 43.5% refundable tax offset.",
              },
              {
                q: 'What is Division 7A and how does it affect my small business?',
                a: 'Division 7A of the Income Tax Assessment Act 1936 (ITAA 1936) prevents private companies from making tax-free payments to shareholders or associates. Loans, payments, or debt forgiveness can be deemed dividends — fully taxable and non-deductible. ATO Tax Optimizer automatically scans your Xero data for Division 7A exposure.',
              },
              {
                q: 'How much can my business recover through unclaimed deductions?',
                a: 'Australian SMEs typically recover $200,000–$500,000 in missed tax benefits through forensic Xero analysis. Common missed deductions include R&D activities not registered with AusIndustry, FBT-exempt benefits misclassified as income, carry-forward tax losses under Subdivision 36-A, and Division 7A issues that can be restructured.',
              },
              {
                q: 'How does Xero connect to the ATO Tax Optimizer?',
                a: "ATO Tax Optimizer uses Xero's official OAuth 2.0 API for read-only access. The connection takes under 60 seconds: authorise access in Xero, and the platform pulls your chart of accounts, transactions, payroll data, and GST history. No data is stored permanently — analysis runs on-demand and reports are exported as PDF or Excel.",
              },
              {
                q: 'What is the difference between FBT and income tax in Australia?',
                a: 'Fringe Benefits Tax (FBT) is paid by employers on non-cash benefits provided to employees (cars, laptops, entertainment). FBT operates on a separate 1 April–31 March year at a flat rate of 47%. Income tax is paid on cash income. Many businesses over-pay FBT by not claiming employee contributions or available exemptions.',
              },
              {
                q: 'Is ATO Tax Optimizer read-only access to my Xero data?',
                a: 'Yes. ATO Tax Optimizer uses read-only OAuth 2.0 scope. The platform cannot create, edit, or delete any Xero records. Access can be revoked at any time from your Xero connected apps settings.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="bg-zinc-900/60 border border-zinc-700 rounded-sm group"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-white list-none">
                  {item.q}
                  <span className="ml-4 flex-shrink-0 text-[#00F5FF] text-lg group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#00F5FF]/10 to-[#00FF88]/5 border border-[#00F5FF]/20 rounded-sm p-8 text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">
              Recover your missed tax benefits
            </h2>
            <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
              ATO Tax Optimizer connects to your Xero account in under 60 seconds and runs a
              complete forensic analysis — R&D Tax Incentive, Division 7A, FBT, and unclaimed
              deductions — in a single pass.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://ato-ai.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#00F5FF] hover:bg-[#00F5FF]/80 text-[#050505] font-bold rounded-sm"
              >
                Try ATO Tax Optimizer — Free
              </a>
              <Link
                href="/founder/integrations/xero"
                className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-sm"
              >
                Connect Xero to Unite-Group
              </Link>
            </div>
          </div>

          {/* Related resources */}
          <div className="border-t border-zinc-800 pt-8 mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Related resources
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/resources/ai-crm-australia"
                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-sm text-zinc-300 hover:text-white"
              >
                AI CRM Guide for Australian SMEs
              </Link>
              <a
                href="https://business.gov.au/grants-and-programs/research-and-development-tax-incentive"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-sm text-zinc-300 hover:text-white"
              >
                AusIndustry RDTI Programme ↗
              </a>
              <a
                href="https://www.ato.gov.au/business/income-and-deductions-for-business/income/division-7a-dividends/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-sm text-zinc-300 hover:text-white"
              >
                ATO Division 7A guidance ↗
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-6">
            <p>
              <strong>Disclaimer:</strong> This guide is for informational purposes only and does
              not constitute tax advice. Always consult a registered tax agent or accountant before
              making tax claims. Tax legislation referenced: ITAA 1997, ITAA 1936, FBTAA 1986.
              Information current as of March 2026 (AEST).
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
