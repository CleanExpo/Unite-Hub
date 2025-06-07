'use client';

import React, { useState, useEffect } from 'react';
import { ExperimentService } from '@/lib/services/experiments';
import type { Experiment, ExperimentStats } from '@/types/experiments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp,
  Play,
  Pause,
  Archive,
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

export function ExperimentsDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [stats, setStats] = useState<ExperimentStats[]>([]);
  const [activeTab, setActiveTab] = useState('active');

  // Load experiments
  useEffect(() => {
    loadExperiments();
  }, [activeTab]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await ExperimentService.getExperiments(status);
      setExperiments(data);
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load stats for selected experiment
  useEffect(() => {
    if (selectedExperiment) {
      loadStats(selectedExperiment.id);
    }
  }, [selectedExperiment]);

  const loadStats = async (experimentId: string) => {
    try {
      const data = await ExperimentService.getExperimentStats(experimentId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusChange = async (experiment: Experiment, newStatus: string) => {
    try {
      await ExperimentService.updateExperiment(experiment.id, { status: newStatus as any });
      loadExperiments();
    } catch (error) {
      console.error('Error updating experiment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'default',
      active: 'default',
      paused: 'secondary',
      completed: 'outline',
      archived: 'destructive',
    };
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Experiment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {experiments.map((experiment) => (
              <Card 
                key={experiment.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedExperiment(experiment)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{experiment.name}</CardTitle>
                    {getStatusBadge(experiment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{experiment.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Traffic
                      </span>
                      <span>{experiment.traffic_percentage}%</span>
                    </div>
                    <Progress value={experiment.traffic_percentage} />
                    
                    <div className="flex gap-2 mt-4">
                      {experiment.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(experiment, 'active');
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {experiment.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(experiment, 'paused');
                          }}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      {experiment.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(experiment, 'active');
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedExperiment && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedExperiment.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedExperiment.hypothesis}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Variants Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Variant Performance</h3>
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div key={stat.variant_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{stat.variant_name}</h4>
                          {stat.is_control && (
                            <Badge variant="outline">Control</Badge>
                          )}
                        </div>
                        {stat.is_significant && (
                          <Badge variant="default">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Significant
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Sample Size</p>
                          <p className="text-xl font-bold">{stat.sample_size}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversions</p>
                          <p className="text-xl font-bold">{stat.conversions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                          <p className="text-xl font-bold">
                            {formatPercentage(stat.conversion_rate)}
                          </p>
                        </div>
                      </div>
                      
                      {stat.confidence_level > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Confidence Level</span>
                            <span>{stat.confidence_level}%</span>
                          </div>
                          <Progress value={stat.confidence_level} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              {selectedExperiment.goals && selectedExperiment.goals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Experiment Goals</h3>
                  <div className="space-y-2">
                    {selectedExperiment.goals.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-2 p-3 border rounded">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Track: {goal.event_name}
                            {goal.target_value && ` • Target: ${goal.target_value}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
