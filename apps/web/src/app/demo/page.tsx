import { JobCardExample } from '@/components/JobCard';

/**
 * Demo Page
 *
 * Demonstrates Australian-first component with:
 * - en-AU spelling, dates, currency
 * - 2025-2026 design aesthetic
 * - Bento grid layout
 * - AI-generated custom icons (NO Lucide)
 */

export default function DemoPage() {
  return (
    <main className="to-primary-50 min-h-screen bg-gradient-to-br from-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Australian Component Demo</h1>
          <p className="text-lg text-gray-600">
            Showcasing en-AU defaults, 2025-2026 aesthetic, and glassmorphism
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="glass-card">
            <h3 className="text-primary-700 mb-2 text-lg font-semibold">🦘 Australian-First</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Dates: DD/MM/YYYY</li>
              <li>• Currency: AUD with GST</li>
              <li>• Phone: 04XX XXX XXX</li>
              <li>• Spelling: en-AU (colour, organisation)</li>
            </ul>
          </div>

          <div className="glass-card">
            <h3 className="text-primary-700 mb-2 text-lg font-semibold">🎨 2025-2026 Design</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Bento grids</li>
              <li>• Glassmorphism</li>
              <li>• NO Lucide icons</li>
              <li>• Soft colored shadows</li>
            </ul>
          </div>

          <div className="glass-card">
            <h3 className="text-primary-700 mb-2 text-lg font-semibold">✅ Truth-First</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 4-tier source hierarchy</li>
              <li>• Confidence scoring</li>
              <li>• Publication blocking</li>
              <li>• Australian sources prioritised</li>
            </ul>
          </div>
        </div>

        {/* Component Demo */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">JobCard Component</h2>
          <p className="mb-6 text-gray-600">
            Water damage restoration job for Brisbane customer. Notice:
          </p>
          <ul className="mb-6 space-y-1 text-sm text-gray-600">
            <li>
              ✅ Phone formatted as <strong>0412 345 678</strong> (Australian mobile)
            </li>
            <li>
              ✅ Address formatted as <strong>Street, Suburb STATE POSTCODE</strong>
            </li>
            <li>
              ✅ Date formatted as <strong>08/01/2025</strong> (DD/MM/YYYY)
            </li>
            <li>
              ✅ Currency as <strong>$2,750.00</strong> (AUD)
            </li>
            <li>
              ✅ GST calculated at <strong>10%</strong> ($250.00)
            </li>
            <li>✅ Custom AI-generated icons (water drop, calendar, location, phone)</li>
            <li>✅ Glassmorphism card with soft teal shadow</li>
            <li>✅ Micro-interactions on hover (scale: 1.02)</li>
          </ul>

          <div className="bento-grid">
            <div className="bento-item-small">
              <JobCardExample />
            </div>
            <div className="bento-item-small">
              <JobCardExample />
            </div>
            <div className="bento-item-small">
              <JobCardExample />
            </div>
          </div>
        </div>

        {/* System Enforcement Notice */}
        <div className="glass-card border-primary-200 mt-8 border-2">
          <h3 className="text-primary-700 mb-3 text-lg font-semibold">🔒 System Enforcement</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>pre-response.hook</strong>: Loaded australian-context.skill.md automatically
            </p>
            <p>
              <strong>design-system.skill.md</strong>: Enforced 2025-2026 aesthetic (NO Lucide
              icons)
            </p>
            <p>
              <strong>verification-first.skill.md</strong>: Would verify all data before deployment
            </p>
            <p>
              <strong>pre-publish.hook</strong>: Would invoke Truth Finder for any content claims
            </p>
            <p>
              <strong>pre-deploy.hook</strong>: Would block deployment if Lighthouse &lt;90 or tests
              fail
            </p>
          </div>
        </div>

        {/* Australian Context Utilities Demo */}
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Australian Context Utilities</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="glass-card">
              <h4 className="mb-2 font-semibold text-gray-900">Date Formatting</h4>
              <code className="text-primary-600 text-sm">
                formatDateAU(new Date(&apos;2025-01-08&apos;))
                <br />
                {'->'} &quot;08/01/2025&quot;
              </code>
            </div>

            <div className="glass-card">
              <h4 className="mb-2 font-semibold text-gray-900">Currency Formatting</h4>
              <code className="text-primary-600 text-sm">
                formatCurrencyAUD(2500.00)
                <br />
                {'->'} &quot;$2,500.00&quot;
              </code>
            </div>

            <div className="glass-card">
              <h4 className="mb-2 font-semibold text-gray-900">Phone Formatting</h4>
              <code className="text-primary-600 text-sm">
                formatPhoneAU(&apos;0412345678&apos;)
                <br />
                {'->'} &quot;0412 345 678&quot;
              </code>
            </div>

            <div className="glass-card">
              <h4 className="mb-2 font-semibold text-gray-900">GST Calculation</h4>
              <code className="text-primary-600 text-sm">
                calculateGST(2500.00)
                <br />
                {'->'} 250.00 (10%)
              </code>
            </div>

            <div className="glass-card">
              <h4 className="mb-2 font-semibold text-gray-900">ABN Formatting</h4>
              <code className="text-primary-600 text-sm">
                formatABN(&apos;12345678901&apos;)
                <br />
                {'->'} &quot;12 345 678 901&quot;
              </code>
            </div>

            <div className="glass-card">
              <h4 className="mb-2 font-semibold text-gray-900">Address Formatting</h4>
              <code className="text-primary-600 text-sm">
                formatAustralianAddress(...)
                <br />
                {'->'} &quot;42 Queen St, Brisbane QLD 4000&quot;
              </code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
