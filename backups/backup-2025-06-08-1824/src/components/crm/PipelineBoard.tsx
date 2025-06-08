import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, User } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface Client {
  id: string;
  name: string;
  company: string;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  stage_id: string;
  status: string;
  created_at: string;
  client: Client[];
}

interface PipelineBoardProps {
  stages: Stage[];
  deals: Deal[];
}

export default function PipelineBoard({ stages, deals }: PipelineBoardProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Active</Badge>;
      case "won":
        return <Badge className="bg-teal-600/20 text-teal-400 border-teal-800">Won</Badge>;
      case "lost":
        return <Badge className="bg-red-600/20 text-red-400 border-red-800">Lost</Badge>;
      default:
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-800">{status}</Badge>;
    }
  };

  return (
    <div className="flex overflow-x-auto pb-4 space-x-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter(deal => deal.stage_id === stage.id);
        
        return (
          <div key={stage.id} className="w-80 flex-shrink-0">
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-medium text-white">{stage.name}</h3>
                <span className="text-slate-400 text-sm">{stageDeals.length} deals</span>
              </div>
              
              <div className="p-2 space-y-2 min-h-[300px]">
                {stageDeals.map((deal) => (
                  <Card key={deal.id} className="bg-slate-750 border-slate-700">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-sm text-white">{deal.name}</CardTitle>
<button 
  className="text-slate-400 hover:text-white"
  aria-label="More options"
>
  <MoreHorizontal className="h-4 w-4" />
</button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-bold text-white">${deal.value.toLocaleString()}</div>
                          <div className="flex items-center mt-2">
                            <div className="bg-slate-700 rounded-full p-1 mr-2">
                              <User className="h-3 w-3 text-teal-400" />
                            </div>
<span className="text-slate-300 text-sm">
  {deal.client.length > 0 ? deal.client[0].name : 'No client'}
</span>
                          </div>
                        </div>
                        {getStatusBadge(deal.status)}
                      </div>
                      <div className="mt-3 text-slate-500 text-xs">
                        Created: {new Date(deal.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {stageDeals.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No deals in this stage</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
