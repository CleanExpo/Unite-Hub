'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Send, X } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
}

interface EmailComposerProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
  clientEmail?: string;
}

export default function EmailComposer({ 
  entityType, 
  entityId, 
  clientEmail 
}: EmailComposerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toEmails, setToEmails] = useState(clientEmail ? [clientEmail] : ['']);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [dealId, setDealId] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/crm/pipeline/deals');
        if (!response.ok) throw new Error('Failed to fetch deals');
        const data = await response.json();
        setDeals(data);
      } catch (error) {
        console.error('Error fetching deals:', error);
      }
    };
    
    fetchDeals();
  }, []);

  const handleSend = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/crm/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          deal_id: dealId || null,
          subject,
          body,
          to_emails: toEmails.filter(e => e),
          cc_emails: ccEmails.filter(e => e),
          status: 'sent'
        })
      });

      if (!response.ok) throw new Error('Failed to send email');
      
      // Reset form
      setSubject('');
      setBody('');
      setToEmails(clientEmail ? [clientEmail] : ['']);
      setCcEmails([]);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  };

  const addEmailField = (type: 'to' | 'cc') => {
    if (type === 'to') {
      setToEmails([...toEmails, '']);
    } else {
      setCcEmails([...ccEmails, '']);
    }
  };

  const updateEmail = (type: 'to' | 'cc', index: number, value: string) => {
    if (type === 'to') {
      const newEmails = [...toEmails];
      newEmails[index] = value;
      setToEmails(newEmails);
    } else {
      const newEmails = [...ccEmails];
      newEmails[index] = value;
      setCcEmails(newEmails);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compose Email</span>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">To</label>
          {toEmails.map((email, index) => (
            <Input
              key={index}
              type="email"
              value={email}
              onChange={(e) => updateEmail('to', index, e.target.value)}
              placeholder="recipient@example.com"
              className="mt-1"
            />
          ))}
          <Button
            variant="link"
            size="sm"
            onClick={() => addEmailField('to')}
            className="mt-1"
          >
            Add recipient
          </Button>
        </div>

        {ccEmails.length > 0 && (
          <div>
            <label className="text-sm font-medium">Cc</label>
            {ccEmails.map((email, index) => (
              <Input
                key={index}
                type="email"
                value={email}
                onChange={(e) => updateEmail('cc', index, e.target.value)}
                placeholder="cc@example.com"
                className="mt-1"
              />
            ))}
          </div>
        )}

        <Button
          variant="link"
          size="sm"
          onClick={() => addEmailField('cc')}
        >
          Add Cc
        </Button>

        <div>
          <label className="text-sm font-medium">Associate with Deal</label>
          <Select
            value={dealId}
            onValueChange={setDealId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a deal" />
            </SelectTrigger>
            <SelectContent>
              {deals.map(deal => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message here..."
            rows={8}
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button 
            onClick={handleSend} 
            disabled={!subject || !body || toEmails.every(e => !e) || sending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
