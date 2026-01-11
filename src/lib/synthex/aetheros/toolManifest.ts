/**
 * AetherOS Omega Protocol - Tool Manifest (The Hands)
 * 
 * Function definitions exposed to the Orchestrator LLM.
 * Enables the AI to use visual generation tools through structured function calls.
 */

import type { AetherOSTool, AetherOSToolName } from './types';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const AETHEROS_TOOLS: Record<AetherOSToolName, AetherOSTool> = {
  generate_ultra_visual: {
    name: 'generate_ultra_visual',
    description: 'Primary visual creation engine using Imagen 4/Nano Banana. Generates high-fidelity images from 14-slot context assembler prompts. Use for hero visuals, product images, marketing assets.',
    parameters: {
      prompt: {
        type: 'string',
        description: '14-Slot Context Assembler string with precise visual specifications. Use Visual Codex translations.',
        required: true,
      },
      aspect_ratio: {
        type: 'enum',
        description: 'Output aspect ratio for the generated visual',
        required: true,
        enum_values: ['16:9', '1:1', '9:16', '4:3'],
        default: '16:9',
      },
      region_routing: {
        type: 'string',
        description: 'Target cloud region for energy arbitrage optimization (e.g., australia-southeast1 for off-peak savings)',
        required: false,
        default: 'australia-southeast1',
      },
      tier: {
        type: 'enum',
        description: 'Generation quality tier: draft (cheap, watermarked), refined (mid-quality preview), production (final high-res)',
        required: true,
        enum_values: ['draft', 'refined', 'production'],
        default: 'draft',
      },
    },
    cost_estimate: 0.02, // Base cost for refined tier
    requires_verification: false,
  },

  surgical_touch_edit: {
    name: 'surgical_touch_edit',
    description: 'Non-destructive image editing. Use to fix typos in text overlays, change colors, remove objects, or adjust specific elements without regenerating entire image. Preserves original composition.',
    parameters: {
      image_id: {
        type: 'string',
        description: 'ID of the source image to edit',
        required: true,
      },
      mask_area: {
        type: 'array',
        description: 'Bounding box coordinates [x_min, y_min, x_max, y_max] defining edit region. Use normalized coordinates 0-1.',
        required: true,
      },
      instruction: {
        type: 'string',
        description: 'Precise edit instruction (e.g., "Change text to Buy Now", "Remove background object", "Adjust color to #FF5733")',
        required: true,
      },
      blend_mode: {
        type: 'enum',
        description: 'How the edit blends with original',
        required: false,
        enum_values: ['seamless', 'overlay', 'replace'],
        default: 'seamless',
      },
    },
    cost_estimate: 0.01,
    requires_verification: false,
  },

  temporal_bridge_video: {
    name: 'temporal_bridge_video',
    description: 'Generate video by interpolating between two static images (keyframes). Uses VEO for smooth frame transitions. Ideal for product reveals, transitions, parallax effects.',
    parameters: {
      start_frame_id: {
        type: 'string',
        description: 'ID of the starting keyframe image',
        required: true,
      },
      end_frame_id: {
        type: 'string',
        description: 'ID of the ending keyframe image',
        required: true,
      },
      duration_seconds: {
        type: 'number',
        description: 'Video duration in seconds (1-10)',
        required: true,
        default: 3,
      },
      physics_engine: {
        type: 'enum',
        description: 'Motion interpolation style',
        required: false,
        enum_values: ['Realistic', 'Anime', '3D Render', 'Smooth'],
        default: 'Realistic',
      },
      fps: {
        type: 'number',
        description: 'Frames per second (24, 30, or 60)',
        required: false,
        default: 30,
      },
    },
    cost_estimate: 0.10, // Video is more expensive
    requires_verification: false,
  },

  truth_audit_search: {
    name: 'truth_audit_search',
    description: 'Retrieve live factual data to prevent hallucinations in infographics, charts, or data visualizations. Uses DataForSEO/Perplexity for verified statistics.',
    parameters: {
      query: {
        type: 'string',
        description: 'The statistical or factual question (e.g., "Tesla Q3 2025 revenue", "Average CPC for software industry 2025")',
        required: true,
      },
      require_sources: {
        type: 'enum',
        description: 'Whether to include source citations',
        required: false,
        enum_values: ['true', 'false'],
        default: 'true',
      },
      date_range: {
        type: 'string',
        description: 'Limit results to specific date range (e.g., "2025-01-01:2025-12-31")',
        required: false,
      },
    },
    cost_estimate: 0.005, // Data queries are cheap
    requires_verification: true, // Facts should be reviewed
  },
};

// ============================================================================
// TOOL ACCESS & VALIDATION
// ============================================================================

/**
 * Get tool definition by name
 */
export function getTool(toolName: AetherOSToolName): AetherOSTool | undefined {
  return AETHEROS_TOOLS[toolName];
}

/**
 * Get all available tools
 */
export function getAllTools(): AetherOSTool[] {
  return Object.values(AETHEROS_TOOLS);
}

/**
 * Validate tool parameters
 */
export function validateToolCall(
  toolName: AetherOSToolName,
  params: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const tool = getTool(toolName);
  const errors: string[] = [];

  if (!tool) {
    errors.push(`Unknown tool: ${toolName}`);
    return { valid: false, errors };
  }

  // Check required parameters
  for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
    if (paramDef.required && !(paramName in params)) {
      errors.push(`Missing required parameter: ${paramName}`);
    }

    // Validate enum values
    if (paramName in params && paramDef.enum_values) {
      const value = params[paramName];
      if (!paramDef.enum_values.includes(String(value))) {
        errors.push(
          `Invalid value for ${paramName}: ${value}. Must be one of: ${paramDef.enum_values.join(', ')}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format tools for Claude function calling
 */
export function formatToolsForClaude(): Array<{
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}> {
  return getAllTools().map((tool) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      properties[paramName] = {
        type: paramDef.type === 'enum' ? 'string' : paramDef.type,
        description: paramDef.description,
        ...(paramDef.enum_values && { enum: paramDef.enum_values }),
      };

      if (paramDef.required) {
        required.push(paramName);
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties,
        required,
      },
    };
  });
}

/**
 * Calculate cost estimate for tool call
 */
export function estimateToolCost(
  toolName: AetherOSToolName,
  params: Record<string, unknown>
): number {
  const tool = getTool(toolName);
  if (!tool) {
return 0;
}

  let cost = tool.cost_estimate;

  // Adjust cost based on parameters
  if (toolName === 'generate_ultra_visual') {
    const tier = params.tier as string;
    if (tier === 'draft') {
      cost = 0.001; // Very cheap for drafts
    }
    if (tier === 'refined') {
      cost = 0.02;
    }
    if (tier === 'production') {
      cost = 0.04; // Full quality
    }
  }

  if (toolName === 'temporal_bridge_video') {
    const duration = (params.duration_seconds as number) || 3;
    cost = 0.10 * (duration / 3); // Scale with duration
  }

  return cost;
}

/**
 * Get tools by cost (for budget-conscious selection)
 */
export function getToolsByCost(maxCost: number): AetherOSTool[] {
  return getAllTools()
    .filter((tool) => tool.cost_estimate <= maxCost)
    .sort((a, b) => a.cost_estimate - b.cost_estimate);
}
