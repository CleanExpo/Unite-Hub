'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  position: number;
}

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
}

export default function PipelineBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Record<string, Deal[]>>({});

  useEffect(() => {
    fetchStages();
  }, []);

  useEffect(() => {
    if (stages.length > 0) {
      fetchDeals();
    }
  }, [stages]);

  const fetchStages = async () => {
    const res = await fetch('/api/crm/pipeline/stages');
    if (res.ok) {
      const data = await res.json();
      setStages(data);
    }
  };

  const fetchDeals = async () => {
    // This would be replaced with an actual API call
    // For now, we'll simulate some data
    const mockDeals: Record<string, Deal[]> = {};
    stages.forEach(stage => {
      mockDeals[stage.id] = [
        { id: `${stage.id}-1`, title: `Deal ${stage.position}`, stage_id: stage.id, amount: 1000 },
        { id: `${stage.id}-2`, title: `Project ${stage.position}`, stage_id: stage.id, amount: 2500 },
      ];
    });
    setDeals(mockDeals);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // No change in position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Reorder deals
    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    const movedDeal = deals[sourceStage].find(deal => deal.id === draggableId);

    if (!movedDeal) return;

    // Remove from source stage
    const newSourceDeals = [...deals[sourceStage]];
    newSourceDeals.splice(source.index, 1);
    
    // Add to destination stage
    const newDestDeals = [...deals[destStage]];
    newDestDeals.splice(destination.index, 0, { ...movedDeal, stage_id: destStage });

    setDeals({
      ...deals,
      [sourceStage]: newSourceDeals,
      [destStage]: newDestDeals
    });

    // In a real app, we would update the deal's stage in the database here
  };

  return (
    <div className="p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 overflow-x-auto">
          {stages.sort((a, b) => a.position - b.position).map(stage => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[300px] bg-gray-50"
                >
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{stage.name}</CardTitle>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {deals[stage.id]?.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded border"
                            >
                              <div className="font-medium">{deal.title}</div>
                              {deal.amount && (
                                <div className="text-sm text-gray-500">${deal.amount.toLocaleString()}</div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
