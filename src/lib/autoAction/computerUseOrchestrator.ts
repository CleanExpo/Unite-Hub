/**
 * Computer Use Orchestrator
 *
 * Central orchestration layer for the Synthex Auto-Action Engine.
 * Coordinates between Fara-7B (action planning) and Qwen2.5-VL (visual understanding)
 * with Critical Point safety gates and sandbox enforcement.
 *
 * Flow:
 * 1. User initiates a task (e.g., "Complete client onboarding")
 * 2. Qwen2.5-VL analyzes the current screen state
 * 3. Fara-7B determines the next action
 * 4. Critical Point Guard checks if approval is needed
 * 5. If approved (or not critical), action is executed in sandbox
 * 6. Loop continues until task is complete or stopped
 */

import { autoActionConfig, isAutoActionConfigured, isFeatureEnabled } from '@config/autoAction.config';
import { FaraClient, FaraAction, FaraRequest, getFaraClient } from './faraClient';
import { QwenVisionClient, ScreenAnalysis, getQwenVisionClient } from './qwenVisionClient';
import { CriticalPointGuard, CriticalPoint, getCriticalPointGuard } from './criticalPointGuard';
import { SandboxManager, getSandboxManager, SandboxValidationResult } from './sandboxConfig';
import { SessionLogger, SessionLog, getSessionLogger } from './sessionLogger';

// ============================================================================
// TYPES
// ============================================================================

export type TaskStatus = 'idle' | 'running' | 'paused' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export interface TaskDefinition {
  id: string;
  type: 'client_onboarding' | 'staff_onboarding' | 'crm_autofill' | 'custom';
  name: string;
  description: string;
  steps?: string[];
  expectedOutcome: string;
  constraints?: string[];
  formData?: Record<string, string>;
}

export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  currentStep: number;
  totalSteps: number;
  progress: number;
  lastAction?: FaraAction;
  lastScreenAnalysis?: ScreenAnalysis;
  pendingApproval?: CriticalPoint;
  errors: string[];
  startedAt: Date;
  updatedAt: Date;
}

export interface ExecutionResult {
  success: boolean;
  taskId: string;
  status: TaskStatus;
  stepsCompleted: number;
  criticalPointsEncountered: number;
  approvalsReceived: number;
  rejectionsReceived: number;
  errors: string[];
  duration: number;
  outcome?: string;
}

export interface OrchestratorOptions {
  onProgress?: (progress: TaskProgress) => void;
  onCriticalPoint?: (criticalPoint: CriticalPoint) => void;
  onActionExecuted?: (action: FaraAction, success: boolean) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// BROWSER INTERFACE (Abstract for different implementations)
// ============================================================================

export interface BrowserInterface {
  screenshot(): Promise<string>;
  click(x: number, y: number): Promise<void>;
  type(text: string): Promise<void>;
  pressKey(key: string, modifiers?: string[]): Promise<void>;
  scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number): Promise<void>;
  navigate(url: string): Promise<void>;
  getCurrentUrl(): Promise<string>;
  getPageTitle(): Promise<string>;
  waitForElement(selector: string, timeout?: number): Promise<boolean>;
  close(): Promise<void>;
}

// ============================================================================
// COMPUTER USE ORCHESTRATOR
// ============================================================================

export class ComputerUseOrchestrator {
  private faraClient: FaraClient;
  private qwenClient: QwenVisionClient;
  private criticalGuard: CriticalPointGuard;
  private sandboxManager: SandboxManager;
  private sessionLogger: SessionLogger;

  private currentTask: TaskDefinition | null = null;
  private currentProgress: TaskProgress | null = null;
  private sessionId: string | null = null;
  private browser: BrowserInterface | null = null;
  private options: OrchestratorOptions = {};

  private isRunning = false;
  private shouldStop = false;

  constructor() {
    this.faraClient = getFaraClient();
    this.qwenClient = getQwenVisionClient();
    this.criticalGuard = getCriticalPointGuard();
    this.sandboxManager = getSandboxManager();
    this.sessionLogger = getSessionLogger();
  }

  /**
   * Initialize the orchestrator with a browser interface
   */
  initialize(browser: BrowserInterface, options?: OrchestratorOptions): void {
    this.browser = browser;
    this.options = options || {};
  }

  /**
   * Start executing a task
   */
  async executeTask(
    task: TaskDefinition,
    userId: string,
    workspaceId: string
  ): Promise<ExecutionResult> {
    // Validation
    if (!isAutoActionConfigured()) {
      return this.createFailedResult(task.id, 'Auto-action engine is not configured');
    }

    if (!this.browser) {
      return this.createFailedResult(task.id, 'Browser interface not initialized');
    }

    if (this.isRunning) {
      return this.createFailedResult(task.id, 'Another task is already running');
    }

    // Check feature flags
    const featureMap: Record<TaskDefinition['type'], keyof typeof autoActionConfig.featureFlags> = {
      client_onboarding: 'clientOnboarding',
      staff_onboarding: 'staffOnboarding',
      crm_autofill: 'crmAutoFill',
      custom: 'clientOnboarding', // Default to clientOnboarding for custom tasks
    };

    if (!isFeatureEnabled(featureMap[task.type])) {
      return this.createFailedResult(task.id, `Feature "${task.type}" is disabled`);
    }

    // Initialize session
    this.sessionId = this.generateSessionId();
    this.currentTask = task;
    this.isRunning = true;
    this.shouldStop = false;

    const startTime = Date.now();

    try {
      // Create sandbox session
      this.sandboxManager.createSession(this.sessionId, userId);

      // Start logging
      this.sessionLogger.startSession(
        this.sessionId,
        userId,
        workspaceId,
        task.type,
        task.description
      );

      // Initialize progress
      this.currentProgress = {
        taskId: task.id,
        status: 'running',
        currentStep: 0,
        totalSteps: task.steps?.length || 10,
        progress: 0,
        errors: [],
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      // Main execution loop
      const result = await this.runExecutionLoop(task);

      // Finalize
      const duration = Date.now() - startTime;
      const sessionLog = this.sessionLogger.endSession(
        this.sessionId,
        result.success ? 'completed' : 'failed',
        {
          success: result.success,
          summary: result.outcome || (result.success ? 'Task completed successfully' : 'Task failed'),
          fieldsCompleted: result.stepsCompleted,
          errors: result.errors,
        }
      );

      this.sandboxManager.endSession(this.sessionId);

      return {
        ...result,
        duration,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.sessionLogger.logError(this.sessionId!, err);
      this.sessionLogger.endSession(this.sessionId!, 'failed', {
        success: false,
        summary: err.message,
        errors: [err.message],
      });
      this.sandboxManager.endSession(this.sessionId!);

      this.options.onError?.(err);

      return this.createFailedResult(task.id, err.message, Date.now() - startTime);
    } finally {
      this.isRunning = false;
      this.currentTask = null;
      this.currentProgress = null;
      this.sessionId = null;
    }
  }

  /**
   * Pause the current task
   */
  pause(): void {
    if (this.isRunning && this.currentProgress) {
      this.currentProgress.status = 'paused';
      this.updateProgress();
    }
  }

  /**
   * Resume a paused task
   */
  resume(): void {
    if (this.currentProgress?.status === 'paused') {
      this.currentProgress.status = 'running';
      this.updateProgress();
    }
  }

  /**
   * Stop the current task
   */
  stop(): void {
    this.shouldStop = true;
    if (this.currentProgress) {
      this.currentProgress.status = 'cancelled';
      this.updateProgress();
    }
  }

  /**
   * Submit approval for a critical point
   */
  submitApproval(criticalPointId: string, approved: boolean, respondedBy: string, note?: string): boolean {
    const result = this.criticalGuard.submitApproval({
      approved,
      criticalPointId,
      respondedBy,
      responseNote: note,
      timestamp: new Date(),
    });

    if (result && this.sessionId) {
      const cp = this.criticalGuard.getCriticalPoint(criticalPointId);
      if (cp) {
        this.sessionLogger.logApprovalReceived(this.sessionId, cp, approved, respondedBy);
      }
    }

    return result;
  }

  /**
   * Get current progress
   */
  getProgress(): TaskProgress | null {
    return this.currentProgress;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if task is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async runExecutionLoop(task: TaskDefinition): Promise<ExecutionResult> {
    let stepsCompleted = 0;
    let criticalPointsEncountered = 0;
    let approvalsReceived = 0;
    let rejectionsReceived = 0;
    const errors: string[] = [];
    const previousActions: FaraAction[] = [];

    while (!this.shouldStop && stepsCompleted < autoActionConfig.sandbox.maxSteps) {
      // Check if paused
      while (this.currentProgress?.status === 'paused') {
        await this.sleep(500);
        if (this.shouldStop) break;
      }

      if (this.shouldStop) break;

      try {
        // Step 1: Take screenshot
        const screenshot = await this.browser!.screenshot();

        // Step 2: Analyze screen with Qwen2.5-VL
        const screenAnalysis = await this.qwenClient.analyzeUI(screenshot);

        if (!screenAnalysis.success) {
          errors.push(`Screen analysis failed: ${screenAnalysis.error}`);
          continue;
        }

        this.currentProgress!.lastScreenAnalysis = screenAnalysis.analysis;

        // Step 3: Check if task is complete
        const currentUrl = await this.browser!.getCurrentUrl();
        const verification = await this.faraClient.verifyTaskCompletion(
          screenshot,
          task.description,
          task.expectedOutcome
        );

        if (verification.complete && verification.confidence > 0.8) {
          this.currentProgress!.status = 'completed';
          this.currentProgress!.progress = 100;
          this.updateProgress();
          this.sessionLogger.logTaskComplete(this.sessionId!, true, 'Task completed successfully');

          return {
            success: true,
            taskId: task.id,
            status: 'completed',
            stepsCompleted,
            criticalPointsEncountered,
            approvalsReceived,
            rejectionsReceived,
            errors,
            duration: 0,
            outcome: 'Task completed successfully',
          };
        }

        // Step 4: Determine next action with Fara-7B
        const faraRequest: FaraRequest = {
          screenshot,
          task: task.description,
          context: task.steps ? `Current step: ${task.steps[stepsCompleted] || 'Continue'}` : undefined,
          previousActions: previousActions.slice(-5),
          constraints: task.constraints,
        };

        const faraResponse = await this.faraClient.determineAction(faraRequest);

        if (!faraResponse.success || !faraResponse.action) {
          errors.push(`Failed to determine action: ${faraResponse.error || faraResponse.reasoning}`);
          continue;
        }

        const action = faraResponse.action;
        this.currentProgress!.lastAction = action;
        this.sessionLogger.logActionPlanned(this.sessionId!, action, faraResponse.reasoning);

        // Step 5: Check for critical points
        const formLabels = screenAnalysis.analysis?.forms?.map((f) => f.label || f.name) || [];
        const detection = this.criticalGuard.detectCriticalPoint(
          action,
          screenAnalysis.analysis?.textContent?.join(' '),
          formLabels
        );

        if (detection.isCritical) {
          criticalPointsEncountered++;

          const criticalPoint = await this.criticalGuard.createCriticalPoint(
            this.sessionId!,
            action,
            {
              pageUrl: currentUrl,
              pageTitle: screenAnalysis.analysis?.pageTitle,
              screenshotBase64: autoActionConfig.logging.includeScreenshots ? screenshot : undefined,
            },
            detection
          );

          this.sessionLogger.logCriticalPointDetected(this.sessionId!, criticalPoint);
          this.sessionLogger.logApprovalRequested(this.sessionId!, criticalPoint);

          // Notify about critical point
          this.currentProgress!.status = 'waiting_approval';
          this.currentProgress!.pendingApproval = criticalPoint;
          this.updateProgress();
          this.options.onCriticalPoint?.(criticalPoint);

          // Wait for approval
          const approvalResponse = await this.criticalGuard.waitForApproval(criticalPoint.id);

          if (!approvalResponse.approved) {
            rejectionsReceived++;
            this.sessionLogger.logApprovalReceived(
              this.sessionId!,
              criticalPoint,
              false,
              approvalResponse.respondedBy
            );

            if (approvalResponse.responseNote === 'Auto-rejected due to timeout') {
              this.sessionLogger.logApprovalTimeout(this.sessionId!, criticalPoint);
            }

            // Skip this action and continue
            errors.push(`Action rejected: ${approvalResponse.responseNote || 'No reason provided'}`);
            this.currentProgress!.status = 'running';
            this.currentProgress!.pendingApproval = undefined;
            continue;
          }

          approvalsReceived++;
          this.sessionLogger.logApprovalReceived(
            this.sessionId!,
            criticalPoint,
            true,
            approvalResponse.respondedBy
          );

          this.currentProgress!.status = 'running';
          this.currentProgress!.pendingApproval = undefined;
        }

        // Step 6: Validate in sandbox
        const validation = this.sandboxManager.validateAction(
          this.sessionId!,
          action.type,
          currentUrl
        );

        if (!validation.allowed) {
          this.sessionLogger.logSandboxViolation(this.sessionId!, validation.violation!);
          errors.push(`Sandbox violation: ${validation.violation!.message}`);

          if (validation.violation!.type === 'max_steps' || validation.violation!.type === 'timeout') {
            break;
          }
          continue;
        }

        // Step 7: Execute action
        const success = await this.executeAction(action);
        this.sandboxManager.recordAction(this.sessionId!);
        this.sessionLogger.logActionExecuted(this.sessionId!, action, success);

        previousActions.push(action);
        stepsCompleted++;

        this.currentProgress!.currentStep = stepsCompleted;
        this.currentProgress!.progress = Math.min(
          95,
          Math.round((stepsCompleted / this.currentProgress!.totalSteps) * 100)
        );
        this.updateProgress();
        this.options.onActionExecuted?.(action, success);

        // Brief pause between actions
        await this.sleep(500);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err.message);
        this.sessionLogger.logError(this.sessionId!, err);

        if (errors.length >= 5) {
          // Too many errors, stop
          break;
        }
      }
    }

    // Determine final status
    const finalStatus: TaskStatus = this.shouldStop
      ? 'cancelled'
      : stepsCompleted >= autoActionConfig.sandbox.maxSteps
        ? 'failed'
        : errors.length >= 5
          ? 'failed'
          : 'completed';

    this.currentProgress!.status = finalStatus;
    this.updateProgress();

    return {
      success: finalStatus === 'completed',
      taskId: task.id,
      status: finalStatus,
      stepsCompleted,
      criticalPointsEncountered,
      approvalsReceived,
      rejectionsReceived,
      errors,
      duration: 0,
      outcome: finalStatus === 'completed'
        ? 'Task completed'
        : finalStatus === 'cancelled'
          ? 'Task was cancelled'
          : 'Task failed due to errors or limits',
    };
  }

  private async executeAction(action: FaraAction): Promise<boolean> {
    if (!this.browser) return false;

    try {
      switch (action.type) {
        case 'click':
        case 'double_click':
        case 'right_click':
          if (action.coordinates) {
            await this.browser.click(action.coordinates.x, action.coordinates.y);
          }
          break;

        case 'type':
          if (action.value) {
            await this.browser.type(action.value);
          }
          break;

        case 'press_key':
          if (action.key) {
            await this.browser.pressKey(action.key, action.modifiers);
          }
          break;

        case 'scroll':
          if (action.direction && action.amount) {
            await this.browser.scroll(action.direction, action.amount);
          }
          break;

        case 'navigate':
          if (action.url) {
            await this.browser.navigate(action.url);
          }
          break;

        case 'wait':
          await this.sleep(action.amount || 1000);
          break;

        case 'hover':
          // Most browser interfaces don't have explicit hover
          break;

        case 'drag':
          // Complex action - may need special handling
          break;

        case 'screenshot':
          // Screenshot is a read-only operation
          await this.browser.screenshot();
          break;

        default:
          return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private updateProgress(): void {
    if (this.currentProgress) {
      this.currentProgress.updatedAt = new Date();
      this.options.onProgress?.(this.currentProgress);

      if (this.sessionId) {
        this.sessionLogger.logTaskProgress(
          this.sessionId,
          this.currentProgress.progress,
          `Step ${this.currentProgress.currentStep}: ${this.currentProgress.status}`
        );
      }
    }
  }

  private createFailedResult(taskId: string, error: string, duration = 0): ExecutionResult {
    return {
      success: false,
      taskId,
      status: 'failed',
      stepsCompleted: 0,
      criticalPointsEncountered: 0,
      approvalsReceived: 0,
      rejectionsReceived: 0,
      errors: [error],
      duration,
      outcome: error,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let orchestratorInstance: ComputerUseOrchestrator | null = null;

export function getComputerUseOrchestrator(): ComputerUseOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ComputerUseOrchestrator();
  }
  return orchestratorInstance;
}

export default ComputerUseOrchestrator;
