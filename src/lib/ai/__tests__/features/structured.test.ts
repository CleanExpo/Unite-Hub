// src/lib/ai/__tests__/features/structured.test.ts
// Tests for Zod-to-tool_use structured output conversion.

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { zodToToolSchema, parseStructuredResponse } from '../../features/structured'

const testSchema = z.object({
  title: z.string(),
  priority: z.number().min(1).max(4),
  tags: z.array(z.string()),
})

describe('zodToToolSchema', () => {
  it('converts Zod schema to tool schema with correct properties', () => {
    const tool = zodToToolSchema('create_task', testSchema, 'Create a new task')

    expect(tool.name).toBe('create_task')
    expect(tool.description).toBe('Create a new task')
    expect(tool.input_schema.type).toBe('object')

    const props = tool.input_schema.properties
    expect(props.title).toEqual({ type: 'string' })
    expect(props.priority).toEqual({ type: 'number', minimum: 1, maximum: 4 })
    expect(props.tags).toEqual({ type: 'array', items: { type: 'string' } })

    expect(tool.input_schema.required).toEqual(['title', 'priority', 'tags'])
  })

  it('handles ZodBoolean type', () => {
    const schema = z.object({ active: z.boolean() })
    const tool = zodToToolSchema('toggle', schema)
    expect(tool.input_schema.properties.active).toEqual({ type: 'boolean' })
  })

  it('handles ZodEnum type', () => {
    const schema = z.object({ status: z.enum(['open', 'closed', 'pending']) })
    const tool = zodToToolSchema('set_status', schema)
    expect(tool.input_schema.properties.status).toEqual({
      type: 'string',
      enum: ['open', 'closed', 'pending'],
    })
  })

  it('handles ZodOptional — marks as not required', () => {
    const schema = z.object({
      name: z.string(),
      notes: z.string().optional(),
    })
    const tool = zodToToolSchema('update', schema)
    expect(tool.input_schema.required).toEqual(['name'])
    expect(tool.input_schema.properties.notes).toEqual({ type: 'string' })
  })

  it('handles nested ZodObject', () => {
    const schema = z.object({
      meta: z.object({
        author: z.string(),
        version: z.number(),
      }),
    })
    const tool = zodToToolSchema('nested', schema)
    expect(tool.input_schema.properties.meta).toEqual({
      type: 'object',
      properties: {
        author: { type: 'string' },
        version: { type: 'number' },
      },
      required: ['author', 'version'],
    })
  })
})

describe('parseStructuredResponse', () => {
  it('parses valid tool_use response block', () => {
    const blocks = [
      { type: 'text', text: 'I will create the task.' },
      {
        type: 'tool_use',
        name: 'create_task',
        input: { title: 'Ship feature', priority: 2, tags: ['release'] },
      },
    ]

    const result = parseStructuredResponse(blocks, 'create_task', testSchema)
    expect(result).toEqual({
      title: 'Ship feature',
      priority: 2,
      tags: ['release'],
    })
  })

  it('throws on invalid data (priority out of range)', () => {
    const blocks = [
      {
        type: 'tool_use',
        name: 'create_task',
        input: { title: 'Bad task', priority: 99, tags: [] },
      },
    ]

    expect(() => parseStructuredResponse(blocks, 'create_task', testSchema)).toThrow()
  })

  it('throws when tool_use block not found', () => {
    const blocks = [
      { type: 'text', text: 'No tool was used.' },
    ]

    expect(() => parseStructuredResponse(blocks, 'create_task', testSchema)).toThrow(
      /tool_use block.*not found/i
    )
  })
})
