import { createClient } from '@/lib/supabase/server';
import PipelineBoard from '@/components/crm/PipelineBoard';

export default async function PipelinePage() {
  const supabase = await createClient();
  
  // Fetch pipeline stages
  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('id, name, order')
    .order('order', { ascending: true });

  // Fetch deals with client information
  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select(`
      id, 
      name, 
      value, 
      stage_id, 
      status, 
      created_at,
      client:clients!inner (id, name, company)
    `);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Deal Pipeline</h1>
        <div className="flex items-center gap-4">
          <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2 rounded-md">
            Add Deal
          </button>
        </div>
      </div>

      {stages && deals ? (
        <PipelineBoard stages={stages} deals={deals} />
      ) : (
        <div className="text-center py-12">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-medium text-slate-300">No pipeline data available</h3>
            <p className="mt-2 text-slate-500">
              Set up your pipeline stages and add deals to get started
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2 rounded-md">
                Configure Stages
              </button>
              <button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-md">
                Add Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
