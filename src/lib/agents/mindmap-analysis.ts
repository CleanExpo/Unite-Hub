/**
 * Mindmap Analysis Agent
 *
 * Purpose: Analyze client's project mindmap and provide intelligent suggestions
 * Model: Claude Sonnet 4.5 with Extended Thinking
 * Features: Prompt caching, extended thinking, workspace isolation
 */

import { anthropic } from "@/lib/anthropic/client";
import { ANTHROPIC_MODELS } from "@/lib/anthropic/models";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";

// =====================================================
// TYPES
// =====================================================

export interface MindmapNode {
  id: string;
  parent_id: string | null;
  node_type: string;
  label: string;
  description: string | null;
  status: string;
  priority: number;
  metadata: Record<string, any>;
  ai_generated: boolean;
}

export interface MindmapConnection {
  id: string;
  source_node_id: string;
  target_node_id: string;
  connection_type: string;
  label: string | null;
}

export interface MindmapStructure {
  mindmap_id: string;
  project_id: string;
  project_title: string;
  nodes: MindmapNode[];
  connections: MindmapConnection[];
}

export interface AISuggestion {
  suggestion_type: string;
  suggestion_text: string;
  reasoning: string;
  confidence_score: number;
  node_id?: string;
}

export interface AnalysisResult {
  suggestions: AISuggestion[];
  insights: {
    total_nodes: number;
    complexity_score: number;
    completeness_score: number;
    identified_gaps: string[];
    estimated_timeline: string | null;
    technology_recommendations: string[];
  };
  cache_stats: {
    input_tokens: number;
    cache_creation_tokens: number;
    cache_read_tokens: number;
    output_tokens: number;
    thinking_tokens: number;
    cache_hit: boolean;
  };
}

// =====================================================
// SYSTEM PROMPT (CACHED)
// =====================================================

const SYSTEM_PROMPT = `You are an expert project analyst specializing in software development planning. Your role is to analyze client project mindmaps and provide actionable suggestions to improve project clarity, scope, and feasibility.

**Your Capabilities:**
1. Identify missing requirements and features
2. Detect potential technical conflicts or challenges
3. Suggest appropriate technologies based on requirements
4. Warn about scope creep or unrealistic expectations
5. Estimate complexity and timeline feasibility
6. Propose alternative approaches when beneficial
7. Clarify vague or ambiguous requirements

**Analysis Guidelines:**
- Be specific and actionable in your suggestions
- Prioritize critical issues over minor improvements
- Consider both technical feasibility and business value
- Warn about potential risks early
- Suggest technologies that match the project's scale and team capabilities
- Identify dependencies between features
- Recommend breaking down complex features into smaller tasks

**Suggestion Types:**
- add_feature: Suggest a missing feature that would be valuable
- clarify_requirement: Request clarification on vague requirements
- identify_dependency: Point out dependencies between features
- suggest_technology: Recommend specific technologies/frameworks
- warn_complexity: Alert about overly complex features
- estimate_cost: Provide rough complexity/timeline estimates
- propose_alternative: Suggest better approaches to achieve goals

**Response Format:**
Provide your analysis as a JSON object with this structure:
{
  "suggestions": [
    {
      "suggestion_type": "add_feature|clarify_requirement|...",
      "suggestion_text": "Clear, actionable suggestion (1-2 sentences)",
      "reasoning": "Why this suggestion matters (2-3 sentences)",
      "confidence_score": 0.0-1.0,
      "node_id": "optional - ID of related node"
    }
  ],
  "insights": {
    "total_nodes": number,
    "complexity_score": 0-100,
    "completeness_score": 0-100,
    "identified_gaps": ["gap1", "gap2"],
    "estimated_timeline": "e.g., 3-6 months" or null,
    "technology_recommendations": ["tech1", "tech2"]
  }
}

**Important:**
- Focus on high-value suggestions (confidence > 0.6)
- Limit to 5-7 suggestions per analysis
- Be encouraging but realistic
- Consider the client's perspective (they may not be technical)
- Explain technical concepts in plain language`;

// =====================================================
// MAIN ANALYSIS FUNCTION
// =====================================================

export async function analyzeMindmap(
  mindmapStructure: MindmapStructure,
  analysisType: "full" | "quick" | "focused" = "full",
  focusNodeId?: string
): Promise<AnalysisResult> {
  try {
    // Prepare context
    const context = prepareMindmapContext(mindmapStructure, focusNodeId);

    // Determine thinking budget based on analysis type
    const thinkingBudget = {
      full: 5000,
      quick: 1000,
      focused: 2000,
    }[analysisType];

    // Call Claude with Extended Thinking
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      thinking: {
        type: "enabled",
        budget_tokens: thinkingBudget,
      },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // Cache system prompt
        },
      ],
      messages: [
        {
          role: "user",
          content: context,
        },
      ],
    })
    });

    const message = result.data;;

    // Extract response
    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n");

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Log cache performance
    console.log("Mindmap Analysis Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      thinking_tokens:
        (message.usage as any).thinking_tokens ||
        (message.usage as any).thinking_input_tokens ||
        0,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    return {
      suggestions: analysis.suggestions || [],
      insights: analysis.insights || {},
      cache_stats: {
        input_tokens: message.usage.input_tokens,
        cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
        cache_read_tokens: message.usage.cache_read_input_tokens || 0,
        output_tokens: message.usage.output_tokens,
        thinking_tokens:
          (message.usage as any).thinking_tokens ||
          (message.usage as any).thinking_input_tokens ||
          0,
        cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
      },
    };
  } catch (error) {
    console.error("Mindmap analysis error:", error);
    throw error;
  }
}

// =====================================================
// HELPER: Prepare context for Claude
// =====================================================

function prepareMindmapContext(
  mindmapStructure: MindmapStructure,
  focusNodeId?: string
): string {
  const { nodes, connections, project_title } = mindmapStructure;

  let context = `# Project: ${project_title}\n\n`;

  // Add focused node context if specified
  if (focusNodeId) {
    const focusNode = nodes.find((n) => n.id === focusNodeId);
    if (focusNode) {
      context += `## Focus Node\nAnalyze specifically around: "${focusNode.label}" (${focusNode.node_type})\n\n`;
    }
  }

  // Add node hierarchy
  context += `## Mindmap Structure (${nodes.length} nodes)\n\n`;

  const rootNodes = nodes.filter((n) => !n.parent_id);
  rootNodes.forEach((rootNode) => {
    context += buildNodeTree(rootNode, nodes, 0);
  });

  // Add connections
  if (connections.length > 0) {
    context += `\n## Node Connections (${connections.length})\n\n`;
    connections.forEach((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.source_node_id);
      const targetNode = nodes.find((n) => n.id === conn.target_node_id);
      context += `- "${sourceNode?.label}" ${conn.connection_type} "${targetNode?.label}"\n`;
    });
  }

  // Add node details
  context += `\n## Node Details\n\n`;
  nodes.forEach((node) => {
    context += `### ${node.label} (${node.node_type})\n`;
    context += `- Status: ${node.status}\n`;
    context += `- Priority: ${node.priority}/10\n`;
    if (node.description) {
      context += `- Description: ${node.description}\n`;
    }
    if (Object.keys(node.metadata).length > 0) {
      context += `- Metadata: ${JSON.stringify(node.metadata)}\n`;
    }
    context += `\n`;
  });

  context += `\n---\n\nAnalyze this project structure and provide suggestions to improve it.`;

  return context;
}

// =====================================================
// HELPER: Build node tree recursively
// =====================================================

function buildNodeTree(
  node: MindmapNode,
  allNodes: MindmapNode[],
  depth: number
): string {
  const indent = "  ".repeat(depth);
  let tree = `${indent}- [${node.node_type}] ${node.label} (${node.status})`;

  if (node.description) {
    tree += ` - ${node.description}`;
  }

  tree += `\n`;

  // Find children
  const children = allNodes.filter((n) => n.parent_id === node.id);
  children.forEach((child) => {
    tree += buildNodeTree(child, allNodes, depth + 1);
  });

  return tree;
}

// =====================================================
// NODE ENRICHMENT AGENT
// =====================================================

export async function enrichNode(
  nodeLabel: string,
  nodeDescription: string | null,
  projectContext: string
): Promise<{
  expanded_description: string;
  technical_requirements: string[];
  estimated_complexity: "low" | "medium" | "high";
  dependencies: string[];
}> {
  try {
    const prompt = `A client added this node to their project mindmap:

**Node Label:** "${nodeLabel}"
**Node Description:** ${nodeDescription || "(no description provided)"}

**Project Context:** ${projectContext}

Expand this node with:
1. A detailed description (2-3 sentences explaining what this entails)
2. Technical requirements (specific features/capabilities needed)
3. Estimated complexity (low/medium/high)
4. Dependencies (what needs to exist first)

Respond in JSON format:
{
  "expanded_description": "...",
  "technical_requirements": ["req1", "req2"],
  "estimated_complexity": "low|medium|high",
  "dependencies": ["dep1", "dep2"]
}`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse enrichment response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Node enrichment error:", error);
    throw error;
  }
}
