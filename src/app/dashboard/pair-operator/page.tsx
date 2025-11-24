'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PairOperatorPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    // Simulated response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Regarding "${input}": This is an advisory suggestion. Consider reviewing related metrics and consulting the relevant dashboard. Confidence: 72%`
      }]);
    }, 500);
    setInput('');
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
        </CardContent>
        <div className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Pair-Operator Constraints</div><p>No direct system changes. Advisory only mode. All suggestions include confidence. Subject to early warning and compliance veto.</p></div></div></CardContent></Card>
    </div>
  );
}
