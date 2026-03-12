// src/lib/ai/features/structured.ts
// Zod-to-tool_use schema conversion and structured response parsing.

import { type ZodType, type ZodObject, type ZodRawShape, ZodFirstPartyTypeKind } from 'zod'

// ── Types ───────────────────────────────────────────────────────────────────

interface JsonSchemaProperty {
  type: string
  minimum?: number
  maximum?: number
  items?: JsonSchemaProperty
  enum?: string[]
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
}

interface ToolInputSchema {
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required: string[]
}

interface ToolSchema {
  name: string
  description?: string
  input_schema: ToolInputSchema
}

// ── Zod introspection helpers ───────────────────────────────────────────────

/**
 * Convert a single Zod type to a JSON Schema property descriptor.
 */
function zodTypeToJsonSchema(zodType: ZodType): JsonSchemaProperty {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (zodType as any)._def

  switch (def.typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return { type: 'string' }

    case ZodFirstPartyTypeKind.ZodNumber: {
      const prop: JsonSchemaProperty = { type: 'number' }
      // Extract min/max checks from Zod's internal checks array
      if (Array.isArray(def.checks)) {
        for (const check of def.checks) {
          if (check.kind === 'min') prop.minimum = check.value
          if (check.kind === 'max') prop.maximum = check.value
        }
      }
      return prop
    }

    case ZodFirstPartyTypeKind.ZodBoolean:
      return { type: 'boolean' }

    case ZodFirstPartyTypeKind.ZodArray:
      return {
        type: 'array',
        items: zodTypeToJsonSchema(def.type),
      }

    case ZodFirstPartyTypeKind.ZodEnum:
      return {
        type: 'string',
        enum: def.values as string[],
      }

    case ZodFirstPartyTypeKind.ZodOptional:
      return zodTypeToJsonSchema(def.innerType)

    case ZodFirstPartyTypeKind.ZodObject:
      return zodObjectToJsonSchema(zodType as ZodObject<ZodRawShape>)

    default:
      return { type: 'string' }
  }
}

/**
 * Convert a ZodObject to a JSON Schema object descriptor with properties and required.
 */
function zodObjectToJsonSchema(schema: ZodObject<ZodRawShape>): JsonSchemaProperty {
  const shape = schema.shape
  const properties: Record<string, JsonSchemaProperty> = {}
  const required: string[] = []

  for (const [key, value] of Object.entries(shape)) {
    properties[key] = zodTypeToJsonSchema(value as ZodType)

    // Check if the field is optional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldDef = (value as any)._def
    if (fieldDef.typeName !== ZodFirstPartyTypeKind.ZodOptional) {
      required.push(key)
    }
  }

  return {
    type: 'object',
    properties,
    required,
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert a Zod object schema to an Anthropic tool_use input_schema definition.
 */
export function zodToToolSchema(
  toolName: string,
  schema: ZodObject<ZodRawShape>,
  description?: string
): ToolSchema {
  const jsonSchema = zodObjectToJsonSchema(schema)

  const tool: ToolSchema = {
    name: toolName,
    input_schema: {
      type: 'object',
      properties: jsonSchema.properties!,
      required: jsonSchema.required!,
    },
  }

  if (description) {
    tool.description = description
  }

  return tool
}

/**
 * Parse a structured response from Anthropic content blocks.
 * Finds the tool_use block matching toolName and validates with the Zod schema.
 */
export function parseStructuredResponse<T>(
  responseBlocks: unknown[],
  toolName: string,
  schema: ZodType<T>
): T {
  const toolBlock = responseBlocks.find((block) => {
    const b = block as Record<string, unknown>
    return b.type === 'tool_use' && b.name === toolName
  }) as Record<string, unknown> | undefined

  if (!toolBlock) {
    throw new Error(`tool_use block for "${toolName}" not found in response`)
  }

  return schema.parse(toolBlock.input)
}
