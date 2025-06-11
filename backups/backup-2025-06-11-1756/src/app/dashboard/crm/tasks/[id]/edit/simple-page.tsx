import { Task } from '@/types/supabase';

export default function SimpleTaskPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Task {params.id}</h1>
      <p>This is a simplified version for testing purposes</p>
    </div>
  );
}
