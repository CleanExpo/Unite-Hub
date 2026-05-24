// src/lib/ai/__tests__/features/sandbox.test.ts
// Unit tests for the code execution sandbox tool.

import { describe, it, expect } from 'vitest'
import { buildSandboxTool, parseSandboxResult } from '../../features/sandbox'
import type { SandboxResult } from '../../features/sandbox'

describe('Code Sandbox', () => {
  it('tool definition has correct type and name', () => {
    const tool = buildSandboxTool()
    expect(tool.type).toBe('code_execution_20250522')
    expect(tool.name).toBe('code_execution')
  })

  it('parses successful execution (return_code=0)', () => {
    const blocks = [
      { type: 'text', text: 'Some preamble' },
      {
        type: 'code_execution_tool_result',
        content: {
          output: '42\n',
          return_code: 0,
        },
      },
    ]
    const result = parseSandboxResult(blocks)
    expect(result).not.toBeNull()
    expect(result!.output).toBe('42\n')
    expect(result!.returnCode).toBe(0)
    expect(result!.success).toBe(true)
  })

  it('returns null when no execution result', () => {
    const blocks = [
      { type: 'text', text: 'No sandbox here' },
    ]
    const result = parseSandboxResult(blocks)
    expect(result).toBeNull()
  })

  it('parses failed execution (return_code=1)', () => {
    const blocks = [
      {
        type: 'code_execution_tool_result',
        content: {
          output: 'Error: division by zero\n',
          return_code: 1,
        },
      },
    ]
    const result = parseSandboxResult(blocks)
    expect(result).not.toBeNull()
    expect(result!.success).toBe(false)
    expect(result!.returnCode).toBe(1)
  })

  it('SandboxResult type is usable', () => {
    const sr: SandboxResult = { output: 'hello', returnCode: 0, success: true }
    expect(sr.success).toBe(true)
  })
})
