/**
 * Service Repair Component
 * Demonstrates chunked operations to prevent overload
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useChunkedOperation } from '@/hooks/useChunkedOperation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  PlayCircle,
  StopCircle,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

interface ServiceItem {
  id: string;
  name: string;
  type: 'component' | 'api' | 'database' | 'cache';
  status: 'healthy' | 'warning' | 'error';
  description?: string;
  last_check?: string;
}

export function ServiceRepairComponent() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real services from API
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('services');
      setServices(data.data || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError('Failed to load services. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Real repair function using API
  const repairService = async (service: ServiceItem): Promise<{
    serviceId: string;
    success: boolean;
    message: string;
  }> => {
    try {
      const response = await apiClient.post('services/repair', {
        serviceIds: [service.id]
      });
      
      const result = response.results?.[0];
      if (result) {
        return {
          serviceId: service.id,
          success: result.success,
          message: result.message
        };
      } else {
        throw new Error('No repair result received');
      }
    } catch (err) {
      return {
        serviceId: service.id,
        success: false,
        message: `Failed to repair ${service.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  };

  // Use chunked operation hook
  const {
    process,
    abort,
    reset,
    state
  } = useChunkedOperation(repairService, {
    maxChunkSize: 3, // Process 3 services at a time
    maxConcurrent: 2, // 2 concurrent repairs
    delayBetweenChunks: 300, // 300ms delay between chunks
    retryAttempts: 2,
    onProgress: (current, total) => {
      console.log(`Progress: ${current}/${total}`);
    },
    onComplete: (results, errors) => {
      console.log('Repair completed:', { results, errors });
    }
  });

  const handleSelectAll = () => {
    if (selectedServices.size === services.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(services.map(s => s.id)));
    }
  };

  const handleToggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleRepair = async () => {
    const servicesToRepair = services.filter(s => selectedServices.has(s.id));
    await process(servicesToRepair);
  };

  const progressPercentage = state.total > 0 
    ? Math.round((state.completed / state.total) * 100) 
    : 0;

  return (
    <Card className="w-full bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Service Repair Manager</CardTitle>
        <CardDescription>
          Repair multiple services without overloading the system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={handleSelectAll}
            variant="outline"
            className="border-slate-600"
          >
            {selectedServices.size === services.length ? 'Deselect All' : 'Select All'}
          </Button>
          
          <Button
            onClick={handleRepair}
            disabled={state.isProcessing || selectedServices.size === 0}
            className="bg-gradient-to-r from-teal-600 to-cyan-600"
          >
            {state.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Repair Selected ({selectedServices.size})
              </>
            )}
          </Button>
          
          {state.isProcessing && (
            <Button
              onClick={abort}
              variant="destructive"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Abort
            </Button>
          )}
          
          {state.status === 'completed' || state.status === 'error' ? (
            <Button
              onClick={reset}
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          ) : null}
        </div>

        {/* Progress */}
        {state.isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Progress: {state.completed}/{state.total}</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Status Summary */}
        {(state.status === 'completed' || state.status === 'error') && (
          <Alert className={state.failed > 0 ? 'border-red-600' : 'border-green-600'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Repair completed: {state.results.length} successful, {state.failed} failed
            </AlertDescription>
          </Alert>
        )}

        {/* Service List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {services.map(service => {
            const isSelected = selectedServices.has(service.id);
            const result = state.results.find(r => r.serviceId === service.id);
            
            return (
              <div
                key={service.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                  ${isSelected ? 'border-teal-600 bg-slate-700' : 'border-slate-700 hover:border-slate-600'}
                `}
                onClick={() => handleToggleService(service.id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleService(service.id)}
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${service.name}`}
                  />
                  <div>
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-sm text-slate-400">
                      Type: {service.type} | Status: {service.status}
                    </div>
                  </div>
                </div>
                
                {result && (
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-slate-400">
                      {result.success ? 'Repaired' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Details */}
        {state.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-400">Errors:</h4>
            {state.errors.map((error, index) => (
              <Alert key={index} className="border-red-600">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.error.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example usage in a page
 */
export function ServiceRepairExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Chunked Service Repair Demo
      </h1>
      <p className="text-slate-400 mb-8">
        This demonstrates how to handle large-scale operations without overloading the system.
        The repair process is chunked into smaller batches with delays between them.
      </p>
      <ServiceRepairComponent />
    </div>
  );
}
