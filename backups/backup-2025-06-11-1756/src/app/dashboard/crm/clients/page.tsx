export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, User } from 'lucide-react';
import ClientTable from '@/components/crm/ClientTable';

export default async function ClientsPage() {
  const supabase = await createClient();
  
  // Fetch clients data
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, company, created_at, status')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Client Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              Unite Group="Search clients..."
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-teal-400" />
            Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients && clients.length > 0 ? (
            <ClientTable clients={clients} />
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-slate-400" />
              <h3 className="mt-4 text-lg font-medium text-slate-300">No clients found</h3>
              <p className="mt-2 text-slate-500">
                Get started by adding your first client
              </p>
              <Button className="mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
