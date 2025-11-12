// Example React components demonstrating Claude AI integration
'use client';

import React, { useState } from 'react';
import {
  useAutoReply,
  usePersona,
  useStrategy,
  useCampaign,
  useHooks,
  useMindmap,
  useAIPipeline,
} from './hooks';
import type { EmailData } from './types';

// Example 1: Auto-Reply Generation
export function AutoReplyExample() {
  const { data, loading, error, execute, reset } = useAutoReply();
  const [email, setEmail] = useState({
    from: '',
    subject: '',
    body: '',
  });

  const handleGenerate = async () => {
    await execute({
      from: email.from,
      subject: email.subject,
      body: email.body,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Auto-Reply Generator</h2>

      <div className="space-y-2">
        <input
          type="email"
          placeholder="From email"
          value={email.from}
          onChange={(e) => setEmail({ ...email, from: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Subject"
          value={email.subject}
          onChange={(e) => setEmail({ ...email, subject: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Email body"
          value={email.body}
          onChange={(e) => setEmail({ ...email, body: e.target.value })}
          className="w-full p-2 border rounded h-32"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Auto-Reply'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Analysis</h3>
            <p><strong>Intent:</strong> {data.analysis.intent}</p>
            <p><strong>Urgency:</strong> {data.analysis.urgency}</p>
            <p><strong>Needs:</strong> {data.analysis.needs.join(', ')}</p>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Qualifying Questions</h3>
            {data.questions.map((q, i) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{i + 1}. {q.question}</p>
                <p className="text-sm text-gray-600">Purpose: {q.purpose}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Email Template</h3>
            <div className="whitespace-pre-wrap">
              {data.emailTemplate.greeting}
              {'\n\n'}
              {data.emailTemplate.acknowledgment}
              {'\n\n'}
              {data.emailTemplate.body}
              {'\n\n'}
              {data.emailTemplate.closing}
              {'\n\n'}
              {data.emailTemplate.signature}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Example 2: Persona Generation
export function PersonaExample() {
  const { data, loading, error, execute } = usePersona();
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [businessDesc, setBusinessDesc] = useState('');

  const handleGenerate = async () => {
    await execute({
      emails,
      businessDescription: businessDesc,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Persona Generator</h2>

      <div className="space-y-2">
        <textarea
          placeholder="Business description"
          value={businessDesc}
          onChange={(e) => setBusinessDesc(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || emails.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {loading ? 'Generating Persona...' : 'Generate Persona'}
      </button>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold text-xl">{data.persona.name}</h3>
            <p className="text-gray-600">{data.persona.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2">Demographics</h4>
              <ul className="text-sm">
                <li>Age: {data.persona.demographics.ageRange}</li>
                <li>Industry: {data.persona.demographics.industry}</li>
                <li>Role: {data.persona.demographics.role}</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2">Communication</h4>
              <ul className="text-sm">
                <li>Channels: {data.persona.communication.preferredChannels.join(', ')}</li>
                <li>Tone: {data.persona.communication.tone}</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-bold mb-2">Top Pain Points</h4>
            {data.persona.painPoints.slice(0, 3).map((p, i) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{p.pain}</p>
                <p className="text-sm text-gray-600">{p.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Example 3: Complete AI Pipeline
export function PipelineExample() {
  const { persona, strategy, campaign, hooks, loading, currentStep, execute, reset } = useAIPipeline();
  const [params, setParams] = useState({
    businessDescription: '',
    businessGoals: '',
    platforms: ['Instagram', 'Facebook'],
    budget: '',
    duration: '',
    objective: '',
  });

  const handleGenerate = async () => {
    await execute({
      emails: [], // Add emails here
      businessDescription: params.businessDescription,
      businessGoals: params.businessGoals,
      platforms: params.platforms,
      budget: params.budget,
      duration: params.duration,
      objective: params.objective,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Complete AI Pipeline</h2>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Business description"
          value={params.businessDescription}
          onChange={(e) => setParams({ ...params, businessDescription: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Business goals"
          value={params.businessGoals}
          onChange={(e) => setParams({ ...params, businessGoals: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Budget"
          value={params.budget}
          onChange={(e) => setParams({ ...params, budget: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Duration (e.g., 30 days)"
          value={params.duration}
          onChange={(e) => setParams({ ...params, duration: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Objective"
          value={params.objective}
          onChange={(e) => setParams({ ...params, objective: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? `Generating ${currentStep}...` : 'Generate Complete Strategy'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Reset
        </button>
      </div>

      {loading && (
        <div className="p-4 bg-blue-100 rounded">
          <p>Current step: <strong>{currentStep}</strong></p>
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded transition-all"
              style={{
                width: `${
                  currentStep === 'persona' ? 25 :
                  currentStep === 'strategy' ? 50 :
                  currentStep === 'campaign' ? 75 :
                  currentStep === 'hooks' ? 90 :
                  currentStep === 'complete' ? 100 : 0
                }%`
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {persona && (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-bold">Persona Generated</h3>
            <p>{persona.persona.name}</p>
          </div>
        )}

        {strategy && (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-bold">Strategy Generated</h3>
            <p>{strategy.strategy.positioning.uvp}</p>
          </div>
        )}

        {campaign && (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-bold">Campaign Generated</h3>
            <p>{campaign.campaign.name}</p>
          </div>
        )}

        {hooks && (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-bold">Hooks Generated</h3>
            <p>{hooks.hooks.length} hooks created</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Example 4: Hooks Generator
export function HooksExample() {
  const { data, loading, error, execute } = useHooks();

  const handleGenerate = async () => {
    await execute({
      persona: { name: 'Sample Persona' }, // Add real persona
      business: 'E-commerce startup',
      platforms: ['TikTok', 'Instagram', 'LinkedIn'],
      toneOfVoice: 'Authentic and inspiring',
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Hooks Generator</h2>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {loading ? 'Generating Hooks...' : 'Generate Hooks'}
      </button>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {data.hooks.slice(0, 9).map((hook, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600">{hook.platform}</span>
                  <span className="text-xs text-gray-600">{hook.funnelStage}</span>
                </div>
                <p className="font-medium mb-2">{hook.hook}</p>
                <p className="text-sm text-gray-600 mb-2">{hook.context}</p>
                <div className="flex justify-between text-xs">
                  <span>Effectiveness: {hook.effectiveness}%</span>
                  <span>{hook.variant}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-100 rounded">
            <h4 className="font-bold mb-2">Testing Strategy</h4>
            <p>{data.recommendations.testingStrategy}</p>
          </div>
        </div>
      )}
    </div>
  );
}
