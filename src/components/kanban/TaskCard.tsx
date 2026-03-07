'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Task, PRIORITY_COLOURS, ASSIGNEE_COLOURS } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <motion.div
      ref={setNodeRef}
      style={{ ...dragStyle, borderLeft: `2px solid ${PRIORITY_COLOURS[task.priority]}` }}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(task)}
      className="cursor-pointer rounded-sm border border-white/10 bg-white/5 p-3 hover:border-white/20 hover:bg-white/[0.08] transition-colors"
    >
      <p className="text-sm font-medium text-white leading-snug mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <span
          className="text-xs px-1.5 py-0.5 rounded-sm font-mono"
          style={{ color: PRIORITY_COLOURS[task.priority], background: `${PRIORITY_COLOURS[task.priority]}20` }}
        >
          {task.priority.toUpperCase()}
        </span>
        {task.assignee_name && (
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-sm"
            style={{ color: ASSIGNEE_COLOURS[task.assignee_type], border: `1px solid ${ASSIGNEE_COLOURS[task.assignee_type]}` }}
          >
            {task.assignee_type === 'agent' ? '🤖' : task.assignee_type === 'client' ? '🏢' : '👤'} {task.assignee_name}
          </span>
        )}
      </div>
      {task.due_date && (
        <p className="text-xs text-white/40 mt-1.5 font-mono">
          Due {new Date(task.due_date).toLocaleDateString('en-AU')}
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-cyan-400/60 font-mono">#{tag}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
