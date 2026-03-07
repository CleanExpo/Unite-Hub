'use client';
import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Task, TaskStatus, COLUMNS, AssigneeType } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { AssigneeFilter } from './AssigneeFilter';
import { SyncStatusBadge } from './SyncStatusBadge';

interface KanbanBoardProps {
  workspaceId: string;
}

export function KanbanBoard({ workspaceId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (assigneeFilter !== 'all') params.set('assignee_type', assigneeFilter);
    const res = await fetch(`/api/kanban/tasks?${params}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [workspaceId, assigneeFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // SSE real-time updates
  useEffect(() => {
    const es = new EventSource(`/api/kanban/events?workspace_id=${workspaceId}`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as { type: string; task?: Task; obsidian_path?: string };
      if (event.type === 'task_synced' && event.task) {
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === event.task!.id);
          return idx >= 0 ? prev.map((t, i) => i === idx ? event.task! : t) : [...prev, event.task!];
        });
      } else if (event.type === 'task_deleted') {
        setTasks(prev => prev.filter(t => t.obsidian_path !== event.obsidian_path));
      }
    };
    return () => es.close();
  }, [workspaceId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    const newStatus = (COLUMNS.find(c => c.id === over.id)?.id ?? draggedTask.status) as TaskStatus;

    setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t));

    await fetch(`/api/kanban/tasks/${draggedTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  if (loading) return <div className="text-white/40 font-mono text-sm p-8">Loading tasks...</div>;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <AssigneeFilter value={assigneeFilter} onChange={setAssigneeFilter} />
        <SyncStatusBadge workspaceId={workspaceId} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={({ active }) => setActiveTask(tasks.find(t => t.id === active.id) ?? null)}
      >
        <div className="grid grid-cols-4 gap-3 flex-1">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasksByStatus(col.id)}
              onTaskClick={setSelectedTask}
              onAddTask={setNewTaskStatus}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {(selectedTask || newTaskStatus) && (
        <TaskModal
          task={selectedTask}
          defaultStatus={newTaskStatus ?? undefined}
          workspaceId={workspaceId}
          onClose={() => { setSelectedTask(null); setNewTaskStatus(null); }}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}
