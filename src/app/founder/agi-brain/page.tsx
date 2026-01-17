'use client';

import { useState, useEffect } from 'react';
import {
  generateBusinessBrainSummary,
  getAtRiskDimensions,
  getStrategicThemes,
  generateMorningBriefing,
  generateMiddayBriefing,
  generateEveningBriefing,
  formatBriefingForDisplay,
  listGoals,
  getCriticalGoals,
  type BusinessBrainSummary,
  type DailyBriefing,
  type PersonalContext,
} from '@/agi';

export default function AGIBrainPage() {
  const [activeTab, setActiveTab] = useState<'goals' | 'business' | 'personal' | 'financial' | 'glasses'>('goals');
  const [businessBrain, setBusinessBrain] = useState<BusinessBrainSummary | null>(null);
  const [briefings, setBriefings] = useState<Record<string, DailyBriefing>>({});
  const [personalContext, setPersonalContext] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [criticalGoals, setCriticalGoals] = useState<any[]>([]);

  useEffect(() => {
    const owner = 'phill';

    // Generate business brain
    const brain = generateBusinessBrainSummary(owner);
    setBusinessBrain(brain);

    // Generate briefings
    const morning = generateMorningBriefing(owner);
    const midday = generateMiddayBriefing(owner);
    const evening = generateEveningBriefing(owner);
    setBriefings({
      morning: morning,
      midday: midday,
      evening: evening
    });

    // Get personal context (in-memory mock for now, wire to Supabase in production)
    const ctx = { cognitiveState: 'good', energyLevel: 'moderate', stressLevel: 'moderate' } as PersonalContext;
    setPersonalContext(ctx);

    // Get goals
    const allGoals = listGoals();
    setGoals(allGoals);

    const critical = getCriticalGoals();
    setCriticalGoals(critical);
  }, []);

  const renderGoalsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Business Goals</h2>

      {criticalGoals.length > 0 && (
        <div className="bg-error-900 text-error-50 p-4 rounded">
          <h3 className="font-semibold mb-2">🚨 Goals at Risk ({criticalGoals.length})</h3>
          <ul className="space-y-1 text-sm">
            {criticalGoals.slice(0, 3).map(g => (
              <li key={g.id}>
                {g.domain}: {g.title} - {Math.round((g.currentValue / g.targetValue) * 100)}%
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const progress = (goal.currentValue / goal.targetValue) * 100;
          const isAtRisk = progress < 50;

          return (
            <div key={goal.id} className={`p-4 rounded border ${isAtRisk ? 'border-error-500 bg-error-50' : 'border-border-subtle bg-bg-card'}`}>
              <h3 className="font-semibold text-lg">{goal.title}</h3>
              <p className="text-sm text-text-muted mb-2">{goal.domain}</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-mono">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-bg-hover rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isAtRisk ? 'bg-error-500' : 'bg-success-500'}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-text-tertiary">
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBusinessTab = () => {
    if (!businessBrain) {
return <div>Loading business intelligence...</div>;
}

    const atRiskDims = getAtRiskDimensions(businessBrain);
    const themes = getStrategicThemes(businessBrain);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Business Brain Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-info-50 p-4 rounded border border-info-300">
            <h3 className="font-semibold text-info-900">Health Score</h3>
            <p className="text-4xl font-bold text-info-600">{businessBrain.healthScore}/100</p>
            <p className="text-sm text-info-800 mt-2">Status: {businessBrain.overallStatus.toUpperCase()}</p>
          </div>

          <div className="bg-bg-hover p-4 rounded border border-border-subtle">
            <h3 className="font-semibold">Strategic Themes</h3>
            <ul className="text-sm space-y-1 mt-2">
              {themes.slice(0, 3).map((theme, i) => (
                <li key={i}>• {theme}</li>
              ))}
            </ul>
          </div>
        </div>

        {atRiskDims.length > 0 && (
          <div className="bg-error-50 p-4 rounded border border-error-300">
            <h3 className="font-semibold text-error-900 mb-2">⚠️ At-Risk Dimensions ({atRiskDims.length})</h3>
            <div className="space-y-2">
              {atRiskDims.map(dim => (
                <div key={dim.dimension} className="text-sm">
                  <span className="font-semibold text-error-900">{dim.dimension}:</span>
                  <p className="text-error-800">{dim.alerts[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-success-50 p-4 rounded border border-success-300">
          <h3 className="font-semibold text-success-900 mb-2">✅ Top Opportunities</h3>
          <ul className="text-sm space-y-1">
            {businessBrain.topOpportunities.slice(0, 3).map((opp, i) => (
              <li key={i}>• {opp}</li>
            ))}
          </ul>
        </div>

        <div className="bg-warning-50 p-4 rounded border border-warning-300">
          <h3 className="font-semibold text-warning-900 mb-2">📋 Immediate Actions</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {businessBrain.immediateActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  const renderPersonalTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Personal State & Context</h2>

      {personalContext ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 p-4 rounded border border-purple-300">
            <h3 className="font-semibold text-purple-900">🧠 Cognitive State</h3>
            <p className="text-lg font-mono text-purple-600 mt-2">{personalContext.cognitiveState || 'unknown'}</p>
          </div>

          <div className="bg-accent-50 p-4 rounded border border-orange-300">
            <h3 className="font-semibold text-accent-900">⚡ Energy Level</h3>
            <p className="text-lg font-mono text-accent-600 mt-2">{personalContext.energyLevel || 'unknown'}</p>
          </div>

          <div className="bg-error-50 p-4 rounded border border-error-300">
            <h3 className="font-semibold text-error-900">😰 Stress Level</h3>
            <p className="text-lg font-mono text-error-600 mt-2">{personalContext.stressLevel || 'unknown'}</p>
          </div>

          <div className="bg-info-50 p-4 rounded border border-info-300">
            <h3 className="font-semibold text-info-900">😴 Sleep Hours</h3>
            <p className="text-lg font-mono text-info-600 mt-2">{personalContext.sleepHours || '?'} hours</p>
          </div>
        </div>
      ) : (
        <div className="text-text-tertiary">No personal context available yet.</div>
      )}

      {personalContext?.warningFlags && personalContext.warningFlags.length > 0 && (
        <div className="bg-error-100 border border-error-400 text-error-700 p-4 rounded">
          <h3 className="font-semibold mb-2">⚠️ Warnings</h3>
          <ul className="space-y-1 text-sm">
            {personalContext.warningFlags.map((flag: string, i: number) => (
              <li key={i}>• {flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderBriefingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Daily Briefings</h2>

      {['morning', 'midday', 'evening'].map(type => {
        const briefing = briefings[type];
        if (!briefing) {
return null;
}

        return (
          <div key={type} className="bg-bg-hover p-4 rounded border border-border-subtle">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg capitalize">{type} Briefing</h3>
              {briefing.isUrgent && <span className="text-error-600 font-bold">🚨 URGENT</span>}
            </div>

            <p className="text-sm text-text-muted mb-3">{briefing.summary}</p>

            <div className="text-xs text-text-tertiary">
              📖 {briefing.estimatedReadTime}min read | ⏱️ {briefing.estimatedActionTime}min action
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-info-600 text-sm">Show full briefing</summary>
              <pre className="mt-2 text-xs bg-bg-card p-2 rounded border overflow-x-auto">
                {formatBriefingForDisplay(briefing)}
              </pre>
            </details>
          </div>
        );
      })}
    </div>
  );

  const renderGlassesTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Smart Glasses Interface</h2>

      <div className="bg-info-50 p-4 rounded border border-info-300">
        <h3 className="font-semibold text-info-900 mb-3">Available Glasses Hardware</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            { name: 'Ray-Ban Meta', features: ['Audio commands', 'Visual overlay', 'Wake word'] },
            { name: 'Solos', features: ['Voice control', 'Bone conduction', 'Gesture'] },
            { name: 'XREAL', features: ['Spatial audio', 'Wide FOV', 'Touch input'] },
            { name: 'VITURE', features: ['120Hz display', 'Gesture control', 'Lightweight'] }
          ].map(device => (
            <div key={device.name} className="bg-bg-card p-3 rounded border">
              <p className="font-semibold">{device.name}</p>
              <ul className="text-xs text-text-muted mt-1 space-y-1">
                {device.features.map(f => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-success-50 p-4 rounded border border-success-300">
        <h3 className="font-semibold text-success-900 mb-2">Voice Commands</h3>
        <ul className="text-sm space-y-1">
          <li>• "Briefing" → Receive morning/midday/evening briefing</li>
          <li>• "Goals" → Check goal status</li>
          <li>• "Advisor" → Ask for personal advice</li>
          <li>• "Business status" → Get quick business summary</li>
          <li>• "Record note" → Voice memo</li>
        </ul>
      </div>

      <div className="text-xs text-text-tertiary">
        <p>🔮 Smart glasses are coming in Phase 10. Setup and connectivity handled by respective device SDKs.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-card p-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">AGI Brain – Founder Command Center</h1>
        <p className="text-text-muted max-w-3xl">
          Unified business intelligence, personal context, goal tracking, and briefing system. Integrated with Phase 8 governance.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-10 border-b">
        {[
          { id: 'goals', label: '🎯 Goals' },
          { id: 'business', label: '📊 Business Brain' },
          { id: 'personal', label: '🧠 Personal' },
          { id: 'financial', label: '💰 Briefings' },
          { id: 'glasses', label: '👓 Glasses' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-info-600 text-info-600'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'business' && renderBusinessTab()}
        {activeTab === 'personal' && renderPersonalTab()}
        {activeTab === 'financial' && renderBriefingsTab()}
        {activeTab === 'glasses' && renderGlassesTab()}
      </div>

      <footer className="mt-20 text-xs text-text-tertiary border-t pt-10">
        <p>Phase 9 – Full Business Brain & Personal AGI Advisor v1.0</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
}
