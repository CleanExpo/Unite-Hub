'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Stage {
  id: string;
  name: string;
  position: number;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  assigned_to: string | null;
}

interface DealFormProps {
  deal?: Deal;
  stages: Stage[];
  onSuccess?: () => void;
}

export default function DealForm({ deal, stages, onSuccess }: DealFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    stage_id: '',
    amount: '',
    description: '',
    assigned_to: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch users for assignment
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/crm/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
    
    if (deal) {
      setFormData({
        title: deal.title || '',
        stage_id: deal.stage_id || '',
        amount: deal.amount ? deal.amount.toString() : '',
        description: deal.description || '',
        assigned_to: deal.assigned_to || ''
      });
    }
  }, [deal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = deal ? `/api/crm/pipeline/deals/${deal.id}` : '/api/crm/pipeline/deals';
      const method = deal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0
        })
      });

      if (!response.ok) throw new Error('Failed to save deal');
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving deal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{deal ? 'Edit Deal' : 'Create New Deal'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Deal Title</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Deal name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stage</label>
            <Select
              value={formData.stage_id}
              onValueChange={value => setFormData(prev => ({ ...prev, stage_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount ($)</label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            <Select
              value={formData.assigned_to}
              onValueChange={value => setFormData(prev => ({ ...prev, assigned_to: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an assignee" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span>{user.full_name || user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deal details"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Deal'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
