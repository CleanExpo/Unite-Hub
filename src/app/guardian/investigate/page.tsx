'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian AI Investigation Console (H08)
 * /guardian/investigate
 *
 * Chat-style natural-language query interface for Guardian data
 */

interface InvestigationTurn {
  sequenceIndex: number;
  question: string;
  answerMarkdown: string;
  answerSummary: string | null;
  answerType: string;
}

export default function GuardianInvestigatePage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [turns, setTurns] = useState<InvestigationTurn[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const suggestedQuestions = [
    'What were the most critical incidents in the last 24 hours?',
    'Are our risk scores trending up or down this week?',
    'Which rules fired the most alerts this month?',
  ];

  async function askQuestion(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);

    const userTurn: InvestigationTurn = {
      sequenceIndex: turns.length,
      question: q,
      answerMarkdown: '',
      answerSummary: null,
      answerType: 'generic',
    };

    setTurns((prev) => [...prev, userTurn]);

    try {
      const res = await fetch('/api/guardian/ai/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Investigation failed');
        setTurns((prev) => prev.slice(0, -1));
        return;
      }

      setTurns((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sequenceIndex: json.turn.sequenceIndex,
          question: json.turn.question,
          answerMarkdown: json.turn.answerMarkdown,
          answerSummary: json.turn.answerSummary,
          answerType: json.turn.answerType,
        };
        return updated;
      });

      setQuestion('');
    } catch (err: any) {
      setError(err?.message || 'Unable to ask question');
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Guardian Investigation Console</h1>
        <p className="text-sm text-muted-foreground">Ask natural-language questions about your Guardian data.</p>
      </header>

      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      {turns.length === 0 && (
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium">Suggested Questions</h2>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, idx) => (
              <button key={idx} type="button" onClick={() => askQuestion(sq)} disabled={loading} className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-xs hover:bg-muted disabled:opacity-50">{sq}</button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-card p-4 space-y-4 min-h-[400px]">
        {turns.map((turn, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-end">
              <div className="rounded-lg bg-primary px-4 py-2 max-w-[80%]">
                <p className="text-sm text-primary-foreground">{turn.question}</p>
              </div>
            </div>
            {turn.answerMarkdown && (
              <div className="flex justify-start">
                <div className="rounded-lg border bg-muted/40 px-4 py-3 max-w-[80%]">
                  <div className="text-sm">{turn.answerMarkdown}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <form onSubmit={(e) => { e.preventDefault(); askQuestion(question); }} className="flex gap-2">
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your Guardian data..." disabled={loading} className="flex-1 h-10 rounded-md border px-3 text-sm disabled:opacity-50" />
        <button type="submit" disabled={loading || !question.trim()} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{loading ? 'Asking...' : 'Ask'}</button>
      </form>
    </main>
  );
}
