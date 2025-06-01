import { TaskForm } from '@/components/crm/TaskForm';
import { getTask } from '@/lib/crm/tasks';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function EditTaskPage({ params }: PageProps) {
  const task = await getTask(params.id);
  if (!task) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Task</h1>
      <TaskForm task={task} />
    </div>
  );
}
