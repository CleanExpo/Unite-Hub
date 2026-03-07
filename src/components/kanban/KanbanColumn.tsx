'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { Task, TaskStatus } from '@/types/kanban';
import { TaskCard } from './TaskCard';

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  'todo': '#666',
  'in-progress': '#00F5FF',
  'blocked': '#FF4444',
  'done': '#00FF88',
};

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanColumn({ id, label, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-h-[200px] w-full rounded-sm border border-white/10 transition-colors"
      style={{
        borderTopColor: COLUMN_ACCENT[id],
        borderTopWidth: 2,
        background: isOver ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-mono tracking-widest" style={{ color: COLUMN_ACCENT[id] }}>{label}</span>
        <span className="text-xs font-mono text-white/40 bg-white/10 px-1.5 py-0.5 rounded-sm">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 flex-1">
          <AnimatePresence>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <button
        onClick={() => onAddTask(id)}
        className="m-2 py-1.5 text-xs text-white/30 hover:text-cyan-400 border border-dashed border-white/10 hover:border-cyan-400/40 rounded-sm transition-colors font-mono"
      >
        + Add task
      </button>
    </div>
  );
}
