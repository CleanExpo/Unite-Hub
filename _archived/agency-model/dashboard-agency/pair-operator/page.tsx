'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function PairOperatorPage() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          message: `[Advisory Mode - Pair Operator] The user is asking an operational advisory question. Provide analysis with a confidence score (0-100%). Be concise and actionable. Question: ${userMsg}`,
          context: 'pair_operator',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Unable to generate a response.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get a response. Please try again.' }]);
      }
    } catch (err) {
      console.error('Pair operator chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Bot className="h-8 w-8" />AI Pair-Operator</h1>
        <p className="text-muted-foreground mt-1">Advisory AI co-pilot for operators</p>
      </div>
      <Card className="h-[400px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Chat</span>
            <Badge variant="outline">Advisory Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ask questions about your data, get advisory suggestions</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-2 rounded ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-sm">
              <div className="inline-block p-2 rounded bg-muted">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Thinking...
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || isLoading}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Pair-Operator Constraints</div><p>No direct system changes. Advisory only mode. All suggestions include confidence. Subject to early warning and compliance veto.</p></div></div></CardContent></Card>
    </div>
  );
}
