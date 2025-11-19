/**
 * Client Portal Home - Phase 1 New UI
 * Feature-flagged parallel implementation
 */

'use client';

export default function ClientHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Client Portal (Phase 1 - New UI)
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Submit ideas, track projects, manage your digital vault
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              ✓ Feature Flag Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8">
          {/* Hero Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Your Creative Hub
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Share your ideas in any format - voice, text, or video. Our AI will help
                transform them into actionable project proposals.
              </p>
              <button className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                Submit New Idea
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Idea Submission */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Idea Submission
              </h3>
              <p className="text-gray-600 text-sm">
                Submit ideas via voice recording, text, or video. AI analyzes and creates
                structured proposals.
              </p>
            </div>

            {/* Project Tracking */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Project Tracking
              </h3>
              <p className="text-gray-600 text-sm">
                Real-time progress updates, task completion proof, and transparent timeline
                tracking.
              </p>
            </div>

            {/* Digital Vault */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Digital Vault
              </h3>
              <p className="text-gray-600 text-sm">
                Secure storage for passwords, API keys, and credentials. Encrypted and
                accessible only to you.
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Phase 1 Architecture Active
                </h3>
                <p className="text-blue-100">
                  This is the new client portal UI running in parallel with the existing
                  system. Feature-flagged for safe deployment.
                </p>
              </div>
              <div className="text-6xl">🚀</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
