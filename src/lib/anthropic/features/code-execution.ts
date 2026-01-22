/**
 * Code Execution Tool Utilities
 *
 * Helpers for using Claude's sandboxed Python execution capability.
 * Enables data analysis, calculations, and code generation with execution.
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import type Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Types
// ============================================================================

export interface CodeExecutionResult {
  /** Whether execution completed successfully */
  success: boolean;
  /** Standard output from execution */
  stdout?: string;
  /** Standard error from execution */
  stderr?: string;
  /** Return value (if any) */
  returnValue?: any;
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  /** Error message if failed */
  error?: string;
}

export interface CodeExecutionToolConfig {
  /** Maximum execution time in seconds (default: 30) */
  timeoutSeconds?: number;
  /** Memory limit in MB (default: 512) */
  memoryLimitMb?: number;
  /** Allowed imports (default: common data science libraries) */
  allowedImports?: string[];
}

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Create the code execution tool definition
 *
 * @param config - Optional execution configuration
 * @returns Tool definition for Messages API
 *
 * @example
 * const tools = [
 *   createCodeExecutionTool({ timeoutSeconds: 60 }),
 *   // ... other tools
 * ];
 */
export function createCodeExecutionTool(
  config: CodeExecutionToolConfig = {}
): Anthropic.Messages.Tool {
  return {
    type: "custom" as any, // Code execution is a special built-in tool type
    name: "code_execution",
    description: `Execute Python code in a sandboxed environment. Useful for:
- Data analysis and calculations
- Text processing and parsing
- Statistical computations
- JSON/CSV manipulation
- Mathematical operations

Available libraries: pandas, numpy, scipy, matplotlib, json, csv, datetime, math, statistics, re

Execution limits:
- Timeout: ${config.timeoutSeconds || 30} seconds
- Memory: ${config.memoryLimitMb || 512} MB
- No network access
- No filesystem access (use provided data only)`,
    input_schema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Python code to execute. Must be valid Python 3.11+ syntax.",
        },
        data: {
          type: "object",
          description: "Optional data to make available as 'input_data' variable",
        },
      },
      required: ["code"],
    },
  } as any;
}

/**
 * Create a server-side web search tool definition
 *
 * @param maxUses - Maximum number of searches per request (default: 5)
 * @returns Tool definition for Messages API
 */
export function createWebSearchTool(maxUses: number = 5): Anthropic.Messages.Tool {
  return {
    type: "web_search_20250305" as any,
    name: "web_search",
    max_uses: maxUses,
  } as any;
}

// ============================================================================
// Result Parsing
// ============================================================================

/**
 * Parse code execution result from tool response
 *
 * @param toolResult - Raw tool result content
 * @returns Parsed execution result
 */
export function parseCodeExecutionResult(
  toolResult: Anthropic.Messages.ToolResultBlockParam
): CodeExecutionResult {
  if (typeof toolResult.content === "string") {
    try {
      const parsed = JSON.parse(toolResult.content);
      return {
        success: !parsed.error,
        stdout: parsed.stdout,
        stderr: parsed.stderr,
        returnValue: parsed.return_value,
        executionTimeMs: parsed.execution_time_ms,
        error: parsed.error,
      };
    } catch {
      return {
        success: true,
        stdout: toolResult.content,
      };
    }
  }

  // Handle array content (text blocks)
  if (Array.isArray(toolResult.content)) {
    const text = toolResult.content
      .filter((b): b is Anthropic.Messages.TextBlockParam => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return {
      success: !toolResult.is_error,
      stdout: text,
      error: toolResult.is_error ? text : undefined,
    };
  }

  return {
    success: false,
    error: "Unknown result format",
  };
}

/**
 * Check if a tool use block is for code execution
 */
export function isCodeExecutionToolUse(
  block: Anthropic.Messages.ContentBlock
): block is Anthropic.Messages.ToolUseBlock & {
  name: "code_execution";
  input: { code: string; data?: any };
} {
  return block.type === "tool_use" && block.name === "code_execution";
}

/**
 * Extract all code execution results from a conversation
 */
export function extractCodeExecutionHistory(
  messages: Anthropic.Messages.MessageParam[]
): Array<{
  code: string;
  result: CodeExecutionResult;
}> {
  const history: Array<{ code: string; result: CodeExecutionResult }> = [];

  for (const message of messages) {
    if (message.role === "assistant" && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (isCodeExecutionToolUse(block as any)) {
          history.push({
            code: (block as any).input.code,
            result: { success: true, stdout: "[Execution pending]" },
          });
        }
      }
    }

    if (message.role === "user" && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (
          block.type === "tool_result" &&
          history.length > 0 &&
          !history[history.length - 1].result.stdout?.includes("[Execution pending]")
        ) {
          continue;
        }
        if (block.type === "tool_result" && history.length > 0) {
          history[history.length - 1].result = parseCodeExecutionResult(
            block as Anthropic.Messages.ToolResultBlockParam
          );
        }
      }
    }
  }

  return history;
}

// ============================================================================
// Code Templates
// ============================================================================

/**
 * Common code templates for data analysis tasks
 */
export const CODE_TEMPLATES = {
  /**
   * Analyze a CSV-like data structure
   */
  analyzeData: (dataDescription: string) => `
import pandas as pd
import json

# Load the provided data
data = json.loads(json.dumps(input_data))
df = pd.DataFrame(data)

# Basic analysis
analysis = {
    "shape": df.shape,
    "columns": list(df.columns),
    "dtypes": df.dtypes.astype(str).to_dict(),
    "null_counts": df.isnull().sum().to_dict(),
    "summary": df.describe().to_dict() if df.select_dtypes(include=['number']).columns.any() else {}
}

print(json.dumps(analysis, indent=2))
`,

  /**
   * Calculate statistics
   */
  calculateStats: (metric: string) => `
import statistics
import json

data = input_data.get("values", [])

if not data:
    print(json.dumps({"error": "No values provided"}))
else:
    stats = {
        "count": len(data),
        "sum": sum(data),
        "mean": statistics.mean(data),
        "median": statistics.median(data),
        "mode": statistics.mode(data) if len(set(data)) < len(data) else None,
        "stdev": statistics.stdev(data) if len(data) > 1 else 0,
        "min": min(data),
        "max": max(data),
    }
    print(json.dumps(stats, indent=2))
`,

  /**
   * Parse and transform JSON data
   */
  transformJson: (transformation: string) => `
import json

data = input_data

# Apply transformation
${transformation}

print(json.dumps(result, indent=2))
`,
} as const;

// ============================================================================
// Helper to Add Code Execution to Params
// ============================================================================

/**
 * Add code execution tool to message params
 *
 * @param params - Base message params
 * @param config - Optional execution config
 * @returns Updated params with code execution tool
 */
export function withCodeExecution<
  T extends Anthropic.Messages.MessageCreateParamsNonStreaming,
>(params: T, config: CodeExecutionToolConfig = {}): T {
  const codeExecTool = createCodeExecutionTool(config);

  return {
    ...params,
    tools: [...(params.tools || []), codeExecTool],
  };
}
