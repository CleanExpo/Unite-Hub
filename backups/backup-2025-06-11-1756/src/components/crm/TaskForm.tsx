'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date?: string;
}

interface TaskFormProps {
  task?: Task;
  onSubmit?: (task: Task) => void;
}

export default function TaskForm({ task, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'pending');
  const [dueDate, setDueDate] = useState(task?.due_date || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        id: task?.id || '',
        title,
        description,
        status,
        due_date: dueDate
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <div className="ui-dropdown">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="ui-select"
            aria-label="Task status"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      
      <Button type="submit" className="mt-4">
        {task ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
}
