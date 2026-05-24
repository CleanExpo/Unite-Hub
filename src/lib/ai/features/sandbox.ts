// src/lib/ai/features/sandbox.ts
// Code execution sandbox tool for Anthropic's server-side code execution.

/** Result of a sandbox code execution. */
export interface SandboxResult {
  output: string
  returnCode: number
  success: boolean
}

/**
 * Builds a code execution tool definition for inclusion in API requests.
 */
export function buildSandboxTool() {
  return {
    type: 'code_execution_20250522' as const,
    name: 'code_execution' as const,
  }
}

/**
 * Parses an array of response content blocks to find a code execution result.
 * Returns null if no `code_execution_tool_result` block is present.
 */
export function parseSandboxResult(blocks: unknown[]): SandboxResult | null {
  for (const block of blocks) {
    if (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      (block as Record<string, unknown>).type === 'code_execution_tool_result' &&
      'content' in block
    ) {
      const content = (block as Record<string, unknown>).content as Record<string, unknown>
      const output = String(content.output ?? '')
      const returnCode = Number(content.return_code ?? 1)
      return {
        output,
        returnCode,
        success: returnCode === 0,
      }
    }
  }
  return null
}
