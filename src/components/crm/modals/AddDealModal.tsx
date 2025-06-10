import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase/client';

interface Stage {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
}

export default function AddDealModal() {
  const [name, setName] = useState('');
  const [value, setValue] = useState<number>(0);
  const [stageId, setStageId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .select('*');
        if (error) {
          setError('Failed to load stages');
        } else {
          setStages(data);
        }
      } catch (err) {
        setError('Error fetching stages');
        console.error(err);
      }
    };

    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*');
        if (error) {
          setError('Failed to load clients');
        } else {
          setClients(data);
        }
      } catch (err) {
        setError('Error fetching clients');
        console.error(err);
      }
    };

    fetchStages();
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!name || !stageId || !status) {
        setError('Missing required fields');
        setIsSubmitting(false);
        return;
      }

      const data = {
        name,
        value,
        stage_id: stageId,
        status,
        client_id: clientId,
        created_at: new Date().toISOString(),
      };

      try {
        const { error: insertError } = await supabase
          .from('deals')
          .insert([data]);

        if (insertError) {
          setError(insertError.message);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        setError('Database error occurred');
        console.error(err);
      }

      setName('');
      setValue(0);
      setStageId('');
      setStatus('');
      setClientId('');
      router.push('/dashboard/crm/deals');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    };
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Deal</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="deal-name" className="block text-gray-700 mb-1">Deal Name</label>
            <input
              id="deal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deal-value" className="block text-gray-700 mb-1">Value ($)</label>
            <input
              id="deal-value"
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deal-stage" className="block text-gray-700 mb-1">Stage</label>
            <div className="ui-dropdown">
              <select
                id="deal-stage"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="ui-select"
                aria-label="Deal stage"
                required
              >
              <option value="">Select a stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="deal-status" className="block text-gray-700 mb-1">Status</label>
            <div className="ui-dropdown">
              <select
                id="deal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="ui-select"
                aria-label="Deal status"
                required
              >
              <option value="">Select a status</option>
              <option value="prospect">Prospect</option>
              <option value="qualified">Qualified</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="deal-client" className="block text-gray-700 mb-1">Client</label>
            <div className="ui-dropdown">
              <select
                id="deal-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="ui-select"
                aria-label="Deal client"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.company})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded"
            >
              {isSubmitting ? 'Adding...' : 'Add Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
