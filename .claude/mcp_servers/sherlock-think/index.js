#!/usr/bin/env node

/**
 * Sherlock Think Alpha MCP Server
 * Allows Claude Code to use Sherlock Think Alpha (1.84M context) as a tool
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not set");
  process.exit(1);
}

const server = new Server(
  {
    name: "sherlock-think-alpha",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "think_deep",
        description: "Use Sherlock Think Alpha (1.84M context) for deep analysis, large codebase understanding, or complex reasoning. Much larger context window than Claude Sonnet.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The analysis task or question"
            },
            context: {
              type: "string",
              description: "Large context to analyze (can be entire codebase)"
            },
            system_prompt: {
              type: "string",
              description: "Optional system prompt to guide the analysis"
            },
            max_tokens: {
              type: "number",
              description: "Maximum tokens to generate (default: 16000)",
              default: 16000
            }
          },
          required: ["prompt", "context"]
        }
      },
      {
        name: "analyze_codebase",
        description: "Analyze entire codebase with Sherlock Think Alpha's 1.84M context window. Returns structured analysis with patterns, issues, and recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to analyze (e.g., 'security audit', 'architecture review', 'performance optimization')"
            },
            files: {
              type: "object",
              description: "Object mapping file paths to their content"
            },
            focus_areas: {
              type: "array",
              items: { type: "string" },
              description: "Specific areas to focus on (optional)"
            }
          },
          required: ["task", "files"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "think_deep") {
      const result = await thinkDeep(
        args.prompt,
        args.context,
        args.system_prompt,
        args.max_tokens
      );

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    }

    if (name === "analyze_codebase") {
      const result = await analyzeCodebase(
        args.task,
        args.files,
        args.focus_areas
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

async function thinkDeep(prompt, context, systemPrompt, maxTokens = 16000) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }

  messages.push({
    role: "user",
    content: `${prompt}\n\n---\n\nContext:\n${context}`
  });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://unite-hub.vercel.app",
      "X-Title": "Unite-Hub"
    },
    body: JSON.stringify({
      model: "openrouter/sherlock-think-alpha",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 1
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  console.error("🧠 Sherlock Think Alpha:", {
    prompt_tokens: data.usage?.prompt_tokens,
    completion_tokens: data.usage?.completion_tokens,
    model: data.model
  });

  return data.choices[0].message.content;
}

async function analyzeCodebase(task, files, focusAreas) {
  const codebaseContext = Object.entries(files)
    .map(([path, content]) => `\n${"=".repeat(60)}\nFile: ${path}\n${"=".repeat(60)}\n${content}`)
    .join("\n\n");

  const systemPrompt = `You are Sherlock Think Alpha with 1.84M context window.
Analyze the entire codebase thoroughly and provide:
1. Architectural patterns and design decisions
2. Code quality and best practices adherence
3. Security vulnerabilities and concerns
4. Performance optimization opportunities
5. Maintainability and scalability issues
6. Specific recommendations with file locations`;

  const prompt = `Task: ${task}

${focusAreas ? `Focus on these areas:\n${focusAreas.map(a => `- ${a}`).join("\n")}\n\n` : ""}

Provide a comprehensive analysis in this format:

## Analysis
[Your detailed analysis]

## Patterns
- [Pattern 1]
- [Pattern 2]

## Issues
- [Issue 1 with file:line]
- [Issue 2 with file:line]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]`;

  const response = await thinkDeep(prompt, codebaseContext, systemPrompt, 16000);

  // Parse structured response
  return {
    analysis: extractSection(response, "Analysis"),
    patterns: extractList(response, "Patterns"),
    issues: extractList(response, "Issues"),
    recommendations: extractList(response, "Recommendations"),
    full_response: response
  };
}

function extractSection(text, sectionName) {
  const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractList(text, sectionName) {
  const section = extractSection(text, sectionName);
  if (!section) return [];

  return section
    .split("\n")
    .filter(line => line.trim().startsWith("-"))
    .map(line => line.replace(/^-\s*/, "").trim());
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("🚀 Sherlock Think Alpha MCP server running");
