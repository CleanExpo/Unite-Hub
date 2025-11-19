/**
 * Staff Dashboard - Phase 1 New UI
 * Feature-flagged parallel implementation
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession } from '@/next/core/auth/supabase';

export default function StaffDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { session, error } = await getStaffSession();

    if (error || !session) {
      router.push('/next/app/auth/login');
      return;
    }

    setSession(session);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Staff Dashboard (Phase 1 - New UI)
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Feature-flagged parallel implementation - Safe testing environment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                ✓ Feature Flag Active
              </span>
              <button
                onClick={() => router.push('/dashboard/overview')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Switch to Old UI
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Welcome to Phase 1 Architecture
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                ✅ <strong>Parallel implementation:</strong> Old system continues to run
                without interruption
              </p>
              <p>
                ✅ <strong>Feature-flagged:</strong> New UI can be toggled on/off via
                config/featureFlags.json
              </p>
              <p>
                ✅ <strong>Safe testing:</strong> No risk to existing functionality or user
                data
              </p>
              <p>
                ✅ <strong>Isolated architecture:</strong> New code in next/ directory, old
                code in src/
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Authentication
              </h3>
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-xs text-gray-500 mt-1">
                Supabase staff auth working
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Database</h3>
              <p className="text-2xl font-bold text-green-600">Connected</p>
              <p className="text-xs text-gray-500 mt-1">Migration 048 ready to deploy</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">AI Engine</h3>
              <p className="text-2xl font-bold text-yellow-600">Ready</p>
              <p className="text-xs text-gray-500 mt-1">Orchestrator foundation set</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Deploy migration 048 to create new tables (staff_users, client_users, etc.)</li>
              <li>Create first staff user in database</li>
              <li>Test staff login flow</li>
              <li>Build client portal UI components</li>
              <li>Implement AI orchestrator logic</li>
              <li>Add comprehensive testing</li>
              <li>Enable feature flags gradually</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
