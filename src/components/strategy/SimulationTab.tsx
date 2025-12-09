"use client";

/**
 * Simulation Tab Component - Phase 11 Week 3-4
 *
 * Displays simulation paths, scores, forecasts, and expected impact.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  RefreshCw,
  Plus,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  Zap,
} from "lucide-react";

interface SimulationRun {
  id: string;
  name: string;
  description: string | null;
  simulation_type: string;
  status: string;
  num_iterations: number;
  confidence_level: number;
  time_horizon_days: number;
  total_paths: number | null;
  expected_value: number | null;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  duration_ms: number | null;
  created_at: string;
}

interface PathEvaluation {
  pathId: string;
  expectedValue: number;
  riskAdjustedValue: number;
  confidenceInterval: [number, number];
  successProbability: number;
  duration: number;
  score: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
}

interface SimulationTabProps {
  organizationId: string;
}

export default function SimulationTab({ organizationId }: SimulationTabProps) {
  const [simulations, setSimulations] = useState<SimulationRun[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationRun | null>(null);
  const [evaluations, setEvaluations] = useState<PathEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSimulation, setNewSimulation] = useState({
    name: "",
    description: "",
    simulation_type: "MULTI_PATH",
    num_iterations: 100,
    confidence_level: 0.95,
    time_horizon_days: 90,
  });

  const fetchSimulations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strategy/simulate?organization_id=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setSimulations(data.simulations || []);
      }
    } catch (error) {
      console.error("Failed to fetch simulations:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  const handleCreateSimulation = async () => {
    try {
      const res = await fetch("/api/strategy/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          simulation: {
            organization_id: organizationId,
            name: newSimulation.name,
            description: newSimulation.description,
            simulation_type: newSimulation.simulation_type,
            config: {
              numIterations: newSimulation.num_iterations,
              confidenceLevel: newSimulation.confidence_level,
              timeHorizonDays: newSimulation.time_horizon_days,
            },
          },
        }),
      });

      if (res.ok) {
        setShowCreateDialog(false);
        setNewSimulation({
          name: "",
          description: "",
          simulation_type: "MULTI_PATH",
          num_iterations: 100,
          confidence_level: 0.95,
          time_horizon_days: 90,
        });
        fetchSimulations();
      }
    } catch (error) {
      console.error("Failed to create simulation:", error);
    }
  };

  const handleRunSimulation = async (simulationId: string) => {
    try {
      const res = await fetch("/api/strategy/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          simulation_id: simulationId,
        }),
      });

      if (res.ok) {
        fetchSimulations();
      }
    } catch (error) {
      console.error("Failed to run simulation:", error);
    }
  };

  const handleSelectSimulation = async (simulation: SimulationRun) => {
    setSelectedSimulation(simulation);

    if (simulation.status === "COMPLETED") {
      try {
        const res = await fetch("/api/strategy/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "evaluate_paths",
            simulation_run_id: simulation.id,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setEvaluations(data.evaluations || []);
        }
      } catch (error) {
        console.error("Failed to evaluate paths:", error);
      }
    } else {
      setEvaluations([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-gray-100 text-gray-800",
      RUNNING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      CANCELLED: "bg-yellow-100 text-yellow-800",
    };
    return <Badge className={colors[status] || "bg-gray-100"}>{status}</Badge>;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) {
return "N/A";
}
    if (ms < 1000) {
return `${ms}ms`;
}
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Strategy Simulations</h3>
          <p className="text-sm text-muted-foreground">
            Run forecasts and compare alternative paths
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSimulations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Simulation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Simulation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newSimulation.name}
                    onChange={(e) =>
                      setNewSimulation({ ...newSimulation, name: e.target.value })
                    }
                    placeholder="Simulation name"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newSimulation.simulation_type}
                    onValueChange={(v) =>
                      setNewSimulation({ ...newSimulation, simulation_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_PATH">Single Path</SelectItem>
                      <SelectItem value="MULTI_PATH">Multi Path</SelectItem>
                      <SelectItem value="MONTE_CARLO">Monte Carlo</SelectItem>
                      <SelectItem value="SCENARIO_ANALYSIS">Scenario Analysis</SelectItem>
                      <SelectItem value="SENSITIVITY_ANALYSIS">Sensitivity Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Iterations</Label>
                    <Input
                      type="number"
                      value={newSimulation.num_iterations}
                      onChange={(e) =>
                        setNewSimulation({
                          ...newSimulation,
                          num_iterations: parseInt(e.target.value) || 100,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Time Horizon (days)</Label>
                    <Input
                      type="number"
                      value={newSimulation.time_horizon_days}
                      onChange={(e) =>
                        setNewSimulation({
                          ...newSimulation,
                          time_horizon_days: parseInt(e.target.value) || 90,
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleCreateSimulation} className="w-full">
                  Create Simulation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Simulations List */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Simulation Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {simulations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No simulations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {simulations.map((sim) => (
                    <div
                      key={sim.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedSimulation?.id === sim.id ? "border-primary bg-muted/50" : ""
                      }`}
                      onClick={() => handleSelectSimulation(sim)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium truncate">{sim.name}</span>
                        {getStatusBadge(sim.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sim.simulation_type} | {sim.num_iterations} iterations
                      </div>
                      {sim.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunSimulation(sim.id);
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selected Simulation Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSimulation ? selectedSimulation.name : "Select a Simulation"}
            </CardTitle>
            {selectedSimulation && (
              <CardDescription>
                {selectedSimulation.description || "No description"}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedSimulation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedSimulation.status)}</div>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <div className="text-lg font-bold">
                      {formatDuration(selectedSimulation.duration_ms)}
                    </div>
                  </div>
                  <div>
                    <Label>Total Paths</Label>
                    <div className="text-lg font-bold">
                      {selectedSimulation.total_paths || "N/A"}
                    </div>
                  </div>
                  <div>
                    <Label>Confidence</Label>
                    <div className="text-lg font-bold">
                      {(selectedSimulation.confidence_level * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {selectedSimulation.expected_value && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label>Expected Value</Label>
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedSimulation.expected_value.toFixed(0)}
                    </div>
                    {selectedSimulation.confidence_interval_low &&
                      selectedSimulation.confidence_interval_high && (
                        <div className="text-sm text-muted-foreground">
                          CI: ${selectedSimulation.confidence_interval_low.toFixed(0)} - $
                          {selectedSimulation.confidence_interval_high.toFixed(0)}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Select a simulation to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Path Evaluations */}
      {evaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Path Evaluations
            </CardTitle>
            <CardDescription>
              Ranked comparison of simulated paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.pathId}
                  className={`p-4 border rounded-lg ${
                    evaluation.rank === 1 ? "border-green-500 bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {evaluation.rank === 1 && (
                        <Zap className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium">
                        Path #{evaluation.rank}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {evaluation.pathId.slice(0, 8)}
                      </span>
                    </div>
                    <Badge variant={evaluation.rank === 1 ? "default" : "secondary"}>
                      Score: {evaluation.score.toFixed(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <Label className="text-xs">Expected Value</Label>
                      <div className="font-bold">${evaluation.expectedValue.toFixed(0)}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Success Prob.</Label>
                      <div className="font-bold">
                        {(evaluation.successProbability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Duration</Label>
                      <div className="font-bold">{evaluation.duration.toFixed(0)}h</div>
                    </div>
                    <div>
                      <Label className="text-xs">Risk-Adjusted</Label>
                      <div className="font-bold">
                        ${evaluation.riskAdjustedValue.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {evaluation.strengths.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {s}
                      </Badge>
                    ))}
                    {evaluation.weaknesses.map((w, i) => (
                      <Badge key={i} variant="outline" className="text-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
