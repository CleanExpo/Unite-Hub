/**
 * Synthex Dashboard (Client Portal)
 * Main dashboard for client users
 */

export default function SynthexDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          Welcome to Synthex
        </h1>
        <p className="text-gray-400 mt-2">
          Your AI-powered marketing intelligence platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-blue-400">
            0
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Content Pieces
          </h3>
          <p className="text-3xl font-bold text-purple-400">
            0
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            SEO Score
          </h3>
          <p className="text-3xl font-bold text-amber-400">
            --
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          Route Group: (synthex)
        </h3>
        <p className="text-gray-400">
          This is the Synthex client marketing portal. Access is controlled by subscription tier (starter, professional, elite).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Quick Actions
          </h3>
          <ul className="space-y-2 text-gray-400">
            <li>• Generate marketing content</li>
            <li>• Run SEO analysis</li>
            <li>• Schedule social posts</li>
            <li>• View analytics</li>
          </ul>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Recent Activity
          </h3>
          <p className="text-gray-500 text-sm">
            No recent activity
          </p>
        </div>
      </div>
    </div>
  );
}
