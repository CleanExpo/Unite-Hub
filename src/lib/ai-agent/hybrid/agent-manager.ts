/**
 * Hybrid AI Agent Manager
 * Manages the lifecycle and coordination between Python backend and TypeScript frontend
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

import {
  AgentState,
  AgentConfig,
  AgentResponse,
  AgentCommand,
  AgentStatus,
  PhaseStatus,
  ExecutionContext,
  AgentEvent,
  validateAgentResponse,
  validateAgentState,
  DEFAULT_AGENT_CONFIG
} from './types';

export interface AgentManagerEvents {
  'state-changed': (state: AgentState) => void;
  'response-received': (response: AgentResponse) => void;
  'execution-started': (context: ExecutionContext) => void;
  'execution-completed': (context: ExecutionContext) => void;
  'execution-failed': (context: ExecutionContext, error: Error) => void;
  'phase-changed': (phase: string, status: PhaseStatus) => void;
  'approval-requested': (phase: string, data: any) => void;
  'error': (error: Error) => void;
}

export class HybridAgentManager extends EventEmitter {
  private config: AgentConfig;
  private state: AgentState;
  private pythonProcess: ChildProcess | null = null;
  private executionQueue: AgentCommand[] = [];
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private stateFilePath: string;
  private configFilePath: string;
  private isInitialized = false;

  constructor(config?: Partial<AgentConfig>) {
    super();
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.state = {
      current_phase: undefined,
      phase_status: PhaseStatus.PENDING,
      completed_phases: [],
      test_results: [],
      last_update: new Date(),
      roadmap_version: '1.0.0',
      agent_status: AgentStatus.IDLE,
      error_message: undefined,
      execution_context: undefined
    };

    this.stateFilePath = path.join(this.config.project_path, 'agent_state.json');
    this.configFilePath = path.join(this.config.project_path, 'agent_config.json');
  }

  /**
   * Initialize the agent manager
   */
  async initialize(): Promise<void> {
    try {
      // Load existing state and config if they exist
      await this.loadState();
      await this.loadConfig();

      // Ensure Python agent script exists
      await this.validatePythonAgent();

      // Set up file watchers for state changes
      this.setupFileWatchers();

      this.isInitialized = true;
      this.emit('state-changed', this.state);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ 
        agent_status: AgentStatus.ERROR, 
        error_message: errorMessage 
      });
      this.emit('error', error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  /**
   * Execute a command using the Python agent
   */
  async executeCommand(command: AgentCommand): Promise<AgentResponse> {
    if (!this.isInitialized) {
      throw new Error('Agent manager not initialized. Call initialize() first.');
    }

    const executionId = uuidv4();
    const executionContext: ExecutionContext = {
      execution_id: executionId,
      command: command.command,
      start_time: new Date(),
      status: 'pending',
      metadata: { ...command.options }
    };

    this.activeExecutions.set(executionId, executionContext);
    this.emit('execution-started', executionContext);

    try {
      // Update execution status
      executionContext.status = 'running';
      this.emit('execution-started', executionContext);

      // Execute Python command
      const response = await this.executePythonCommand(command, executionContext);

      // Update execution context
      executionContext.status = 'completed';
      executionContext.end_time = new Date();
      executionContext.output = response.message;

      this.emit('execution-completed', executionContext);
      this.emit('response-received', response);

      // Update agent state based on response
      if (response.agent_status) {
        this.updateState({ agent_status: response.agent_status });
      }

      return response;
    } catch (error) {
      // Update execution context with error
      executionContext.status = 'failed';
      executionContext.end_time = new Date();
      executionContext.error = error instanceof Error ? error.message : 'Unknown error';

      this.emit('execution-failed', executionContext, error instanceof Error ? error : new Error('Unknown error'));
      
      // Update agent state
      this.updateState({ 
        agent_status: AgentStatus.ERROR, 
        error_message: executionContext.error 
      });

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Initialize a new phase
   */
  async initPhase(phaseName: string): Promise<AgentResponse> {
    const command: AgentCommand = {
      command: 'init_phase',
      args: [phaseName],
      options: {},
      timeout: this.config.execution_timeout,
      priority: 1
    };

    const response = await this.executeCommand(command);
    
    if (response.success) {
      this.updateState({
        current_phase: phaseName,
        phase_status: PhaseStatus.IN_PROGRESS
      });
      this.emit('phase-changed', phaseName, PhaseStatus.IN_PROGRESS);
    }

    return response;
  }

  /**
   * Generate tests for current phase
   */
  async generateTests(testType: string = 'unit'): Promise<AgentResponse> {
    const command: AgentCommand = {
      command: 'generate_tests',
      args: [testType],
      options: {},
      timeout: this.config.execution_timeout,
      priority: 2
    };

    return await this.executeCommand(command);
  }

  /**
   * Run Docker tests
   */
  async runDockerTests(): Promise<AgentResponse> {
    const command: AgentCommand = {
      command: 'run_docker_tests',
      args: [],
      options: {},
      timeout: this.config.execution_timeout * 2, // Double timeout for Docker operations
      priority: 1
    };

    const response = await this.executeCommand(command);
    
    if (response.success && response.data?.test_results) {
      this.updateState({
        test_results: response.data.test_results,
        phase_status: PhaseStatus.TESTING
      });
    }

    return response;
  }

  /**
   * Get current status report
   */
  async getStatusReport(): Promise<AgentResponse> {
    const command: AgentCommand = {
      command: 'report_status',
      args: [],
      options: {},
      timeout: 10000, // Quick operation
      priority: 3
    };

    return await this.executeCommand(command);
  }

  /**
   * Complete current phase
   */
  async completePhase(): Promise<AgentResponse> {
    if (!this.state.current_phase) {
      throw new Error('No active phase to complete');
    }

    const command: AgentCommand = {
      command: 'complete_phase',
      args: [this.state.current_phase],
      options: {},
      timeout: this.config.execution_timeout,
      priority: 1
    };

    const response = await this.executeCommand(command);
    
    if (response.success) {
      this.updateState({
        completed_phases: [...this.state.completed_phases, this.state.current_phase],
        current_phase: undefined,
        phase_status: PhaseStatus.COMPLETE
      });
      this.emit('phase-changed', this.state.current_phase!, PhaseStatus.COMPLETE);
    }

    return response;
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  async updateConfig(updates: Partial<AgentConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }

  /**
   * Check if agent is ready to execute commands
   */
  isReady(): boolean {
    return this.isInitialized && this.state.agent_status !== AgentStatus.ERROR;
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel a specific execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = 'cancelled';
    execution.end_time = new Date();
    
    // Kill Python process if it's running this execution
    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
    }

    this.activeExecutions.delete(executionId);
    return true;
  }

  /**
   * Shutdown the agent manager
   */
  async shutdown(): Promise<void> {
    // Cancel all active executions
    for (const executionId of this.activeExecutions.keys()) {
      await this.cancelExecution(executionId);
    }

    // Kill Python process
    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
    }

    // Save final state
    await this.saveState();

    this.isInitialized = false;
    this.removeAllListeners();
  }

  /**
   * Execute Python command and parse response
   */
  private async executePythonCommand(command: AgentCommand, context: ExecutionContext): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      const args = [this.config.agent_script_path, command.command, ...command.args];
      
      this.pythonProcess = spawn(this.config.python_executable, args, {
        cwd: this.config.project_path,
        env: { ...process.env, ...this.config.environment_variables }
      });

      let stdout = '';
      let stderr = '';

      this.pythonProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout
      const timeout = setTimeout(() => {
        this.pythonProcess?.kill('SIGTERM');
        reject(new Error(`Command timed out after ${command.timeout}ms`));
      }, command.timeout);

      this.pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        this.pythonProcess = null;

        if (code === 0) {
          try {
            // Try to parse the last line as JSON response
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            
            let response: AgentResponse;
            try {
              const parsed = JSON.parse(lastLine);
              response = validateAgentResponse(parsed);
            } catch {
              // If parsing fails, create a basic response
              response = {
                success: true,
                message: stdout || 'Command executed successfully',
                timestamp: new Date(),
                phase: this.state.current_phase,
                next_actions: []
              };
            }

            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse agent response: ${error}`));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}. Error: ${stderr}`));
        }
      });

      this.pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Update agent state
   */
  private updateState(updates: Partial<AgentState>): void {
    this.state = {
      ...this.state,
      ...updates,
      last_update: new Date()
    };
    
    // Emit state change event
    this.emit('state-changed', this.state);
    
    // Save state to file (fire and forget)
    this.saveState().catch(error => {
      console.error('Failed to save agent state:', error);
    });
  }

  /**
   * Load agent state from file
   */
  private async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects
      if (parsed.last_update) {
        parsed.last_update = new Date(parsed.last_update);
      }
      if (parsed.test_results) {
        parsed.test_results = parsed.test_results.map((result: any) => ({
          ...result,
          timestamp: result.timestamp ? new Date(result.timestamp) : undefined
        }));
      }

      this.state = validateAgentState(parsed);
    } catch (error) {
      // File doesn't exist or is invalid, use default state
      console.log('Using default agent state');
    }
  }

  /**
   * Save agent state to file
   */
  private async saveState(): Promise<void> {
    try {
      await fs.writeFile(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Failed to save agent state:', error);
    }
  }

  /**
   * Load agent configuration from file
   */
  private async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.config = { ...this.config, ...parsed };
    } catch (error) {
      // File doesn't exist, save current config
      await this.saveConfig();
    }
  }

  /**
   * Save agent configuration to file
   */
  private async saveConfig(): Promise<void> {
    try {
      await fs.writeFile(this.configFilePath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save agent config:', error);
    }
  }

  /**
   * Validate Python agent script exists
   */
  private async validatePythonAgent(): Promise<void> {
    try {
      const agentPath = path.join(this.config.project_path, this.config.agent_script_path);
      await fs.access(agentPath);
    } catch (error) {
      throw new Error(`Python agent script not found at: ${this.config.agent_script_path}`);
    }
  }

  /**
   * Setup file watchers for state changes
   */
  private setupFileWatchers(): void {
    // Watch for external state changes (e.g., from Python agent)
    if (typeof window === 'undefined') { // Only in Node.js environment
      const chokidar = require('chokidar');
      
      chokidar.watch(this.stateFilePath).on('change', async () => {
        try {
          await this.loadState();
          this.emit('state-changed', this.state);
        } catch (error) {
          console.error('Failed to reload state from file:', error);
        }
      });
    }
  }
}

export default HybridAgentManager;
