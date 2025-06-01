import { createClient } from '@/lib/supabase/server';
import { Task } from '@/types/supabase';

export async function getTask(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching task:', error);
    return null;
  }

  return data as Task;
}

export async function updateTask(task: Task) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .update(task)
    .eq('id', task.id)
    .select();

  if (error) {
    console.error('Error updating task:', error);
    return null;
  }

  return data[0] as Task;
}

export async function createTask(task: Omit<Task, 'id'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }

  return data[0] as Task;
}
