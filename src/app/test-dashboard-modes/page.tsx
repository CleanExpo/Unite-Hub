'use client';

/**
 * Test Dashboard Modes (Bypasses Auth)
 * Navigate to: http://localhost:3008/test-dashboard-modes
 */

import { DashboardModeToggle } from '@/components/dashboard/DashboardModeToggle';
import { useState } from 'react';

export default function TestDashboardModesPage() {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-base to-bg-raised p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-3">
            Dashboard Modes Demo
          </h1>
          <p className="text-text-secondary text-lg">
            Pattern 2 Solution: "There's too much I don't need yet" (4 users)
          </p>
        </div>

        <DashboardModeToggle
          currentMode={mode}
          userId="test-user-123"
          onModeChange={(newMode) => setMode(newMode)}
        />

        <div className="bg-bg-card border border-border-base rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Current Mode: <span className="text-accent-500">{mode === 'simple' ? 'Simple' : 'Advanced'}</span>
          </h2>

          <div className="space-y-3">
            <div>
              <div className="font-medium text-text-primary mb-2">Dashboard Sections Visible:</div>
              {mode === 'simple' ? (
                <ul className="space-y-1 text-text-secondary">
                  <li>✅ Overview</li>
                  <li>✅ Contacts</li>
                  <li>✅ Emails</li>
                  <li>✅ Campaigns</li>
                  <li>✅ Analytics</li>
                  <li>✅ Settings</li>
                  <li className="text-text-tertiary">⬜ AI Tools (hidden)</li>
                  <li className="text-text-tertiary">⬜ Orchestrator (hidden)</li>
                  <li className="text-text-tertiary">⬜ Founder Tools (hidden)</li>
                  <li className="text-text-tertiary">⬜ Market Intelligence (hidden)</li>
                </ul>
              ) : (
                <ul className="space-y-1 text-text-secondary">
                  <li>✅ Overview</li>
                  <li>✅ Contacts</li>
                  <li>✅ Emails</li>
                  <li>✅ Campaigns</li>
                  <li>✅ Analytics</li>
                  <li>✅ Settings</li>
                  <li>✅ AI Tools</li>
                  <li>✅ Orchestrator</li>
                  <li>✅ Content Generator</li>
                  <li>✅ Founder Intelligence</li>
                  <li>✅ Market Intelligence</li>
                  <li>✅ Insights</li>
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-border-base">
              <div className="font-medium text-text-primary mb-2">User Impact:</div>
              <div className="text-sm text-text-secondary">
                {mode === 'simple'
                  ? '📊 Showing 6 core sections - Perfect for small businesses and new users'
                  : '🚀 Showing all 12+ sections - Full power user experience'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-6">
          <h3 className="font-semibold text-text-primary mb-2">Pattern 2 Feedback Addressed:</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>✅ Mike (Electrician): "Overwhelming, saw 50 buttons" → Simple mode shows 6 sections</li>
            <li>✅ Emma (Restoration): "Just want basic CRM" → Simple mode = basic CRM only</li>
            <li>✅ James (Contractor): "Do I need all this?" → Simple mode hides advanced</li>
            <li>✅ Tom (Consultant): "Confusing" → Clear Simple vs Advanced choice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
