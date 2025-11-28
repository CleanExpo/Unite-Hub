/**
 * Fara-7B Computer-Use Client
 *
 * Type-safe wrapper for calling Fara-7B as a computer-use model.
 * Supports local (on-device) and remote provider modes.
 *
 * Fara-7B (based on Aria-UI) is a vision-language model specialized for
 * UI understanding and computer-use tasks like clicking, typing, scrolling.
 */

import { autoActionConfig } from '@config/autoAction.config';

// ============================================================================
// TYPES
// ============================================================================

export type ActionType =
  | 'click'
  | 'double_click'
  | 'right_click'
  | 'type'
  | 'press_key'
  | 'scroll'
  | 'hover'
  | 'drag'
  | 'wait'
  | 'screenshot'
  | 'navigate';

export interface UIElement {
  type: string;
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  selector?: string;
}

export interface FaraAction {
  type: ActionType;
  target?: UIElement | string;
  value?: string;
  coordinates?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  key?: string;
  modifiers?: string[];
  url?: string;
  confidence: number;
  reasoning: string;
}

export interface FaraRequest {
  screenshot: string; // Base64 encoded image
  task: string;
  context?: string;
  previousActions?: FaraAction[];
  constraints?: string[];
  maxActions?: number;
}

export interface FaraResponse {
  success: boolean;
  action?: FaraAction;
  actions?: FaraAction[];
  taskComplete: boolean;
  reasoning: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface FaraClientOptions {
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

// ============================================================================
// FARA CLIENT
// ============================================================================

export class FaraClient {
  private endpoint: string;
  private apiKey: string | undefined;
  private options: Required<FaraClientOptions>;

  constructor(options: FaraClientOptions = {}) {
    this.endpoint = autoActionConfig.fara7b.endpoint;
    this.apiKey = autoActionConfig.fara7b.apiKey;
    this.options = {
      timeout: options.timeout ?? autoActionConfig.sandbox.stepTimeoutMs,
      retries: options.retries ?? 3,
      debug: options.debug ?? autoActionConfig.logging.level === 'debug',
    };
  }

  /**
   * Determine the next action based on the current screen state and task
   */
  async determineAction(request: FaraRequest): Promise<FaraResponse> {
    if (!autoActionConfig.enabled) {
      return {
        success: false,
        taskComplete: false,
        reasoning: 'Auto-action engine is disabled',
        error: 'AUTO_ACTION_DISABLED',
      };
    }

    const payload = this.buildPayload(request);

    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        const response = await this.callProvider(payload);
        return this.parseResponse(response);
      } catch (error) {
        if (attempt === this.options.retries) {
          return {
            success: false,
            taskComplete: false,
            reasoning: `Failed after ${this.options.retries} attempts`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    return {
      success: false,
      taskComplete: false,
      reasoning: 'Unexpected error',
      error: 'UNEXPECTED_ERROR',
    };
  }

  /**
   * Plan multiple actions for a complex task
   */
  async planActions(request: FaraRequest): Promise<FaraResponse> {
    const enhancedRequest: FaraRequest = {
      ...request,
      task: `Plan the sequence of actions needed to: ${request.task}. Return all required actions in order.`,
      maxActions: request.maxActions ?? 10,
    };

    return this.determineAction(enhancedRequest);
  }

  /**
   * Verify if a task has been completed by analyzing the screen
   */
  async verifyTaskCompletion(
    screenshot: string,
    task: string,
    expectedOutcome: string
  ): Promise<{ complete: boolean; confidence: number; reasoning: string }> {
    const response = await this.determineAction({
      screenshot,
      task: `Verify if the following task has been completed: "${task}". Expected outcome: "${expectedOutcome}". Respond with whether the task is complete and your confidence level.`,
    });

    return {
      complete: response.taskComplete,
      confidence: response.action?.confidence ?? 0,
      reasoning: response.reasoning,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private buildPayload(request: FaraRequest): Record<string, unknown> {
    const systemPrompt = `You are Fara-7B, an AI assistant specialized in computer-use tasks.
You analyze screenshots and determine the next action to accomplish the user's task.
You must respond with a specific action (click, type, scroll, etc.) and clear reasoning.
Always prioritize user safety and never perform destructive actions without explicit confirmation.`;

    const userPrompt = this.buildUserPrompt(request);

    return {
      model: autoActionConfig.fara7b.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/png;base64,${request.screenshot}` } },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
      max_tokens: autoActionConfig.fara7b.maxTokens,
      temperature: autoActionConfig.fara7b.temperature,
    };
  }

  private buildUserPrompt(request: FaraRequest): string {
    let prompt = `Task: ${request.task}\n\n`;

    if (request.context) {
      prompt += `Context: ${request.context}\n\n`;
    }

    if (request.previousActions && request.previousActions.length > 0) {
      prompt += `Previous actions taken:\n`;
      request.previousActions.forEach((action, i) => {
        prompt += `${i + 1}. ${action.type}: ${action.reasoning}\n`;
      });
      prompt += '\n';
    }

    if (request.constraints && request.constraints.length > 0) {
      prompt += `Constraints:\n`;
      request.constraints.forEach((c) => {
        prompt += `- ${c}\n`;
      });
      prompt += '\n';
    }

    prompt += `Analyze the screenshot and determine the next action. Respond in JSON format:
{
  "action": {
    "type": "click|type|scroll|press_key|wait|navigate",
    "target": "description of target element or coordinates",
    "value": "text to type if applicable",
    "coordinates": {"x": 0, "y": 0},
    "confidence": 0.0-1.0,
    "reasoning": "why this action"
  },
  "taskComplete": false,
  "reasoning": "overall analysis"
}`;

    return prompt;
  }

  private async callProvider(payload: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Fara-7B API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseResponse(raw: unknown): FaraResponse {
    try {
      const data = raw as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };

      const content = data.choices?.[0]?.message?.content || '';

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          taskComplete: false,
          reasoning: 'Could not parse action from response',
          error: 'PARSE_ERROR',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        action: parsed.action,
        actions: parsed.actions,
        taskComplete: parsed.taskComplete ?? false,
        reasoning: parsed.reasoning ?? '',
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        taskComplete: false,
        reasoning: 'Failed to parse response',
        error: error instanceof Error ? error.message : 'PARSE_ERROR',
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let faraClientInstance: FaraClient | null = null;

export function getFaraClient(options?: FaraClientOptions): FaraClient {
  if (!faraClientInstance) {
    faraClientInstance = new FaraClient(options);
  }
  return faraClientInstance;
}

export default FaraClient;
