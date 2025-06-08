export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server';
import CommunicationHub from '@/components/crm/CommunicationHub';

export default async function CommunicationPage() {
  const supabase = await createClient();
  
  // Fetch all communication items
  const { data: communications, error } = await supabase
    .from('communication_logs')
    .select(`
      id,
      type,
      subject,
      content,
      created_at,
      related_client:clients (id, name),
      related_deal:deals (id, name),
      user:profiles (id, full_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Communication Hub</h1>
        <div className="flex items-center gap-4">
          <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2 rounded-md">
            New Email
          </button>
          <button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-md">
            Log Call
          </button>
        </div>
      </div>

      <CommunicationHub communications={communications || []} />
    </div>
  );
}
