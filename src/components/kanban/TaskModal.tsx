'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, AssigneeType } from '@/types/kanban';

interface TaskModalProps {
  task: Task | null;
  defaultStatus?: TaskStatus;
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskModal({ task, defaultStatus, workspaceId, onClose, onSaved }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [assigneeType, setAssigneeType] = useState<AssigneeType>(task?.assignee_type ?? 'self');
  const [assigneeName, setAssigneeName] = useState(task?.assignee_name ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [tags, setTags] = useState(task?.tags.join(', ') ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      title, description, status, priority,
      assignee_type: assigneeType,
      assignee_name: assigneeName || undefined,
      due_date: dueDate || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      workspace_id: workspaceId,
    };
    const url = task ? `/api/kanban/tasks/${task.id}` : '/api/kanban/tasks';
    await fetch(url, { method: task ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    await fetch(`/api/kanban/tasks/${task.id}`, { method: 'DELETE' });
    onSaved();
    onClose();
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 font-mono";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60" onClick={onClose}>
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 p-6 overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-mono tracking-widest text-white/60">{task ? 'EDIT TASK' : 'NEW TASK'}</h2>
            <button onClick={onClose}><X size={16} className="text-white/40 hover:text-white" /></button>
          </div>

          <div className="flex flex-col gap-4">
            <input className={fieldClass} placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            <textarea className={`${fieldClass} h-24 resize-none`} placeholder="Description (syncs to Obsidian)" value={description} onChange={e => setDescription(e.target.value)} />

            <div className="grid grid-cols-2 gap-3">
              <select className={fieldClass} value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
              <select className={fieldClass} value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select className={fieldClass} value={assigneeType} onChange={e => setAssigneeType(e.target.value as AssigneeType)}>
                <option value="self">✦ You</option>
                <option value="agent">🤖 Agent</option>
                <option value="staff">👤 Staff</option>
                <option value="client">🏢 Client</option>
              </select>
              <input className={fieldClass} placeholder="Assignee name" value={assigneeName} onChange={e => setAssigneeName(e.target.value)} />
            </div>

            <input type="date" className={fieldClass} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <input className={fieldClass} placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 text-sm font-mono bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 rounded-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : task ? 'Update' : 'Create Task'}
            </button>
            {task && (
              <button onClick={handleDelete} className="px-3 py-2 text-sm font-mono text-red-400/60 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-sm transition-colors">
                Delete
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
