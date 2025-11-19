/**
 * OpenRouter API Client
 * Integrates Sherlock Think Alpha (1.84M context) with Claude Sonnet 4.5
 */

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  provider?: {
    order?: string[];
    allow_fallbacks?: boolean;
  };
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY_2 || process.env.OPENROUTER_API_KEY || process.env.OPEN_API_KEY || "";

    if (!this.apiKey) {
      console.warn("⚠️  OpenRouter API key not set. OpenRouter models will not be available.");
    }
  }

  /**
   * Call Sherlock Think Alpha for deep analysis with large context
   */
  async thinkDeep(
    prompt: string,
    context: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key required for Sherlock Think Alpha");
    }

    const messages: OpenRouterMessage[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: `${prompt}\n\n---\n\nContext:\n${context}`,
    });

    const request: OpenRouterRequest = {
      model: "openrouter/sherlock-think-alpha",
      messages,
      max_tokens: options?.maxTokens || 8000,
      temperature: options?.temperature || 0.7,
      top_p: 1,
      provider: {
        order: ["openrouter"],
        allow_fallbacks: false,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://unite-hub.vercel.app",
          "X-Title": "Unite-Hub",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();

      console.log("🧠 Sherlock Think Alpha usage:", {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
        model: data.model,
      });

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Sherlock Think Alpha:", error);
      throw error;
    }
  }

  /**
   * Analyze entire codebase with 1.84M context window
   */
  async analyzeCodebase(
    task: string,
    files: Record<string, string>,
    options?: {
      maxTokens?: number;
      focusAreas?: string[];
    }
  ): Promise<{
    analysis: string;
    recommendations: string[];
    patterns: string[];
    issues: string[];
  }> {
    const codebaseContext = Object.entries(files)
      .map(([path, content]) => `\n--- ${path} ---\n${content}`)
      .join("\n\n");

    const systemPrompt = `You are Sherlock Think Alpha, a deep reasoning AI with 1.84M context window.
Analyze the entire codebase thoroughly and provide:
1. Architectural patterns and design decisions
2. Code quality and best practices adherence
3. Security vulnerabilities and concerns
4. Performance optimization opportunities
5. Maintainability and scalability issues
6. Specific recommendations with file locations`;

    const prompt = `Task: ${task}

${options?.focusAreas ? `Focus on these areas:\n${options.focusAreas.map(a => `- ${a}`).join("\n")}\n\n` : ""}

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

    const response = await this.thinkDeep(prompt, codebaseContext, {
      maxTokens: options?.maxTokens || 16000,
      temperature: 0.3, // Lower temperature for analysis
      systemPrompt,
    });

    // Parse the structured response
    const sections = {
      analysis: this.extractSection(response, "Analysis"),
      recommendations: this.extractList(response, "Recommendations"),
      patterns: this.extractList(response, "Patterns"),
      issues: this.extractList(response, "Issues"),
    };

    return sections;
  }

  /**
   * General chat completion (for model router)
   */
  async chat(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key required");
    }

    const messages: OpenRouterMessage[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const request: OpenRouterRequest = {
      model: options?.model || "google/gemini-2.0-flash",
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature !== undefined ? options.temperature : 0.7,
      top_p: 1,
      provider: {
        allow_fallbacks: true,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://unite-hub.vercel.app",
          "X-Title": "Unite-Hub",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenRouter:", error);
      throw error;
    }
  }

  /**
   * Check if OpenRouter is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get context window size
   */
  getContextWindow(): number {
    return 1_840_000; // Sherlock Think Alpha context window
  }

  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }

  private extractList(text: string, sectionName: string): string[] {
    const section = this.extractSection(text, sectionName);
    if (!section) return [];

    return section
      .split("\n")
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.replace(/^-\s*/, "").trim());
  }
}

// Singleton instance
let openRouterClient: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!openRouterClient) {
    openRouterClient = new OpenRouterClient();
  }
  return openRouterClient;
}

/**
 * Generate text with KatCoder (Sherlock Think Alpha)
 * Backwards compatibility function for legacy code
 */
export async function generateWithKatCoder(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const client = getOpenRouterClient();

  if (!client.isAvailable()) {
    throw new Error("OpenRouter API key not configured. Please set OPENROUTER_API_KEY or OPENROUTER_API_KEY_2 in environment variables.");
  }

  return client.thinkDeep(prompt, "", {
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
    systemPrompt: options?.systemPrompt,
  });
}
