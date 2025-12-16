/**
 * Decision Circuit Executor
 * Manages circuit execution with full traceability and logging
 */

import { createClient } from '@/lib/supabase/server';
import {
  CircuitExecutionLog,
  CircuitResult,
  DECISION_CIRCUITS,
  DecisionCircuit,
  validateCircuitInputs,
} from './registry';

export interface CircuitExecutionContext {
  workspace_id: string;
  client_id: string;
  request_id: string;
  user_id: string;
}

export interface CircuitInput {
  [key: string]: unknown;
}

export interface CircuitOutput {
  [key: string]: unknown;
}

/**
 * Execute a decision circuit with full traceability
 */
export async function executeCircuit<T extends CircuitOutput>(
  circuitId: string,
  inputs: CircuitInput,
  context: CircuitExecutionContext,
  execute: (inputs: CircuitInput) => Promise<T>
): Promise<CircuitResult<T>> {
  const startTime = Date.now();
  const circuit = DECISION_CIRCUITS[circuitId];
  const decision_path: string[] = [];

  if (!circuit) {
    throw new Error(`Circuit not found: ${circuitId}`);
  }

  // Validate inputs
  const validation = validateCircuitInputs(circuit, inputs);
  if (!validation.valid) {
    throw new Error(
      `Missing required inputs for ${circuitId}: ${validation.missing.join(', ')}`
    );
  }

  decision_path.push(`ENTER:${circuitId}`);

  try {
    // Execute circuit logic
    const output = await execute(inputs);
    decision_path.push(`SUCCESS:${circuitId}`);

    const latency_ms = Date.now() - startTime;

    // Log execution
    const executionLog: CircuitExecutionLog = {
      circuit_id: circuitId,
      execution_id: context.request_id,
      timestamp: Date.now(),
      workspace_id: context.workspace_id,
      client_id: context.client_id,
      inputs,
      outputs: output,
      decision_path,
      success: true,
      latency_ms,
    };

    await logCircuitExecution(executionLog);

    return {
      success: true,
      data: output,
      execution_log: executionLog,
      decision_trace: decision_path,
    };
  } catch (error) {
    const latency_ms = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    decision_path.push(`FAILED:${circuitId}:${circuit.failure_mode}`);

    const executionLog: CircuitExecutionLog = {
      circuit_id: circuitId,
      execution_id: context.request_id,
      timestamp: Date.now(),
      workspace_id: context.workspace_id,
      client_id: context.client_id,
      inputs,
      outputs: {},
      decision_path,
      success: false,
      error: errorMessage,
      latency_ms,
    };

    await logCircuitExecution(executionLog);

    return {
      success: false,
      error: errorMessage,
      execution_log: executionLog,
      decision_trace: decision_path,
    };
  }
}

/**
 * Log circuit execution to audit trail
 */
async function logCircuitExecution(log: CircuitExecutionLog): Promise<void> {
  try {
    const supabase = createClient();

    await supabase.from('circuit_execution_logs').insert({
      circuit_id: log.circuit_id,
      execution_id: log.execution_id,
      timestamp: new Date(log.timestamp).toISOString(),
      workspace_id: log.workspace_id,
      client_id: log.client_id,
      inputs: log.inputs,
      outputs: log.outputs,
      decision_path: log.decision_path,
      success: log.success,
      error: log.error,
      latency_ms: log.latency_ms,
      confidence_score: log.confidence_score,
    });
  } catch (error) {
    console.error('Failed to log circuit execution:', error);
    // Don't throw - logging failure shouldn't break execution
  }
}

/**
 * Retrieve execution history for a client
 */
export async function getCircuitExecutionHistory(
  workspace_id: string,
  client_id: string,
  limit: number = 100
): Promise<CircuitExecutionLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('circuit_execution_logs')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('client_id', client_id)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to retrieve execution history: ${error.message}`);
  }

  return (data || []).map((row) => ({
    circuit_id: row.circuit_id,
    execution_id: row.execution_id,
    timestamp: new Date(row.timestamp).getTime(),
    workspace_id: row.workspace_id,
    client_id: row.client_id,
    inputs: row.inputs,
    outputs: row.outputs,
    decision_path: row.decision_path,
    success: row.success,
    error: row.error,
    latency_ms: row.latency_ms,
    confidence_score: row.confidence_score,
  }));
}

/**
 * Get circuit performance metrics
 */
export async function getCircuitMetrics(
  workspace_id: string,
  circuitId: string,
  days: number = 30
): Promise<{
  total_executions: number;
  success_rate: number;
  avg_latency_ms: number;
  error_count: number;
}> {
  const supabase = createClient();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase
    .from('circuit_execution_logs')
    .select('success, latency_ms')
    .eq('workspace_id', workspace_id)
    .eq('circuit_id', circuitId)
    .gte('timestamp', sinceDate.toISOString());

  if (error) {
    throw new Error(`Failed to retrieve metrics: ${error.message}`);
  }

  const logs = data || [];
  const successCount = logs.filter((log) => log.success).length;
  const totalLatency = logs.reduce((sum, log) => sum + (log.latency_ms || 0), 0);

  return {
    total_executions: logs.length,
    success_rate: logs.length > 0 ? successCount / logs.length : 0,
    avg_latency_ms: logs.length > 0 ? totalLatency / logs.length : 0,
    error_count: logs.length - successCount,
  };
}

/**
 * Chain multiple circuits together
 */
export async function chainCircuits(
  circuits: Array<{
    circuitId: string;
    inputs: CircuitInput;
    execute: (inputs: CircuitInput) => Promise<CircuitOutput>;
  }>,
  context: CircuitExecutionContext
): Promise<{
  success: boolean;
  results: CircuitResult[];
  final_output: CircuitOutput;
  total_decision_path: string[];
}> {
  const results: CircuitResult[] = [];
  let final_output: CircuitOutput = {};
  const total_decision_path: string[] = [];

  for (const { circuitId, inputs, execute } of circuits) {
    // Merge previous outputs into inputs
    const mergedInputs = { ...inputs, ...final_output };

    const result = await executeCircuit(
      circuitId,
      mergedInputs,
      context,
      execute
    );

    results.push(result);
    total_decision_path.push(...result.decision_trace);

    if (!result.success) {
      return {
        success: false,
        results,
        final_output,
        total_decision_path,
      };
    }

    if (result.data) {
      final_output = { ...final_output, ...result.data };
    }
  }

  return {
    success: true,
    results,
    final_output,
    total_decision_path,
  };
}
