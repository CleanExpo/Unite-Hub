'use client';
import { useEffect, useState } from 'react';

export default function GuardianExplainabilityPage() {
  const [explanations, setExplanations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/guardian/ai/explain');
      const json = await res.json();
      if (res.ok) setExplanations(json.explanations ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Guardian Explainability Hub</h1>
        <p className="text-sm text-muted-foreground">AI-powered explanations for Guardian signals</p>
      </header>

      <section className="rounded-xl border bg-card p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading explanations...</p>
        ) : explanations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No explanations yet. Use Explain buttons in Guardian pages.</p>
        ) : (
          <div className="space-y-3">
            {explanations.map((exp) => (
              <div key={exp.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{exp.entity_type}: {exp.entity_id.substring(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(exp.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm">{exp.summary_markdown.substring(0, 200)}...</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
