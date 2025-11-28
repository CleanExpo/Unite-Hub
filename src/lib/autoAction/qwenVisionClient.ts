/**
 * Qwen2.5-VL Vision-Language Client
 *
 * Client wrapper for Qwen2.5-VL to provide visual grounding,
 * OCR, and UI element localization for the auto-action engine.
 *
 * Qwen2.5-VL excels at understanding visual content and can identify
 * UI elements, read text, and provide spatial information.
 */

import { autoActionConfig } from '@config/autoAction.config';

// ============================================================================
// TYPES
// ============================================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface DetectedElement {
  id: string;
  type: 'button' | 'input' | 'link' | 'text' | 'image' | 'checkbox' | 'dropdown' | 'form' | 'unknown';
  text?: string;
  placeholder?: string;
  label?: string;
  bounds: BoundingBox;
  interactable: boolean;
  attributes?: Record<string, string>;
}

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file' | 'textarea';
  label?: string;
  placeholder?: string;
  required: boolean;
  currentValue?: string;
  options?: string[];
  bounds: BoundingBox;
}

export interface ScreenAnalysis {
  pageTitle?: string;
  pageType: 'form' | 'list' | 'dashboard' | 'login' | 'settings' | 'document' | 'unknown';
  elements: DetectedElement[];
  forms: FormField[];
  textContent: string[];
  activeElement?: DetectedElement;
  errors?: string[];
  warnings?: string[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  bounds: BoundingBox;
}

export interface QwenRequest {
  image: string; // Base64 encoded image
  task: 'analyze_ui' | 'detect_elements' | 'extract_form' | 'ocr' | 'find_element' | 'describe';
  query?: string;
  targetElement?: string;
}

export interface QwenResponse {
  success: boolean;
  analysis?: ScreenAnalysis;
  elements?: DetectedElement[];
  forms?: FormField[];
  ocrResults?: OCRResult[];
  description?: string;
  targetLocation?: BoundingBox;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface QwenClientOptions {
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

// ============================================================================
// QWEN VISION CLIENT
// ============================================================================

export class QwenVisionClient {
  private endpoint: string;
  private apiKey: string | undefined;
  private options: Required<QwenClientOptions>;

  constructor(options: QwenClientOptions = {}) {
    this.endpoint = autoActionConfig.qwenVL.endpoint;
    this.apiKey = autoActionConfig.qwenVL.apiKey;
    this.options = {
      timeout: options.timeout ?? autoActionConfig.sandbox.stepTimeoutMs,
      retries: options.retries ?? 3,
      debug: options.debug ?? autoActionConfig.logging.level === 'debug',
    };
  }

  /**
   * Analyze a UI screenshot and extract structured information
   */
  async analyzeUI(screenshot: string): Promise<QwenResponse> {
    return this.process({
      image: screenshot,
      task: 'analyze_ui',
    });
  }

  /**
   * Detect all interactive elements on the screen
   */
  async detectElements(screenshot: string): Promise<QwenResponse> {
    return this.process({
      image: screenshot,
      task: 'detect_elements',
    });
  }

  /**
   * Extract form fields from the screen
   */
  async extractFormFields(screenshot: string): Promise<QwenResponse> {
    return this.process({
      image: screenshot,
      task: 'extract_form',
    });
  }

  /**
   * Perform OCR on the screenshot
   */
  async performOCR(screenshot: string): Promise<QwenResponse> {
    return this.process({
      image: screenshot,
      task: 'ocr',
    });
  }

  /**
   * Find a specific element on the screen
   */
  async findElement(screenshot: string, elementDescription: string): Promise<QwenResponse> {
    return this.process({
      image: screenshot,
      task: 'find_element',
      targetElement: elementDescription,
    });
  }

  /**
   * Get a natural language description of the screen
   */
  async describeScreen(screenshot: string, query?: string): Promise<QwenResponse> {
    return this.process({
      image: screenshot,
      task: 'describe',
      query,
    });
  }

  /**
   * Map detected elements to a coordinate system for Fara-7B
   */
  async getClickableAreas(screenshot: string): Promise<Map<string, BoundingBox>> {
    const response = await this.detectElements(screenshot);
    const areas = new Map<string, BoundingBox>();

    if (response.success && response.elements) {
      response.elements
        .filter((el) => el.interactable)
        .forEach((el) => {
          const key = el.text || el.label || el.id;
          if (key) {
            areas.set(key, el.bounds);
          }
        });
    }

    return areas;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async process(request: QwenRequest): Promise<QwenResponse> {
    if (!autoActionConfig.enabled) {
      return {
        success: false,
        error: 'Auto-action engine is disabled',
      };
    }

    const payload = this.buildPayload(request);

    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        const response = await this.callProvider(payload);
        return this.parseResponse(response, request.task);
      } catch (error) {
        if (attempt === this.options.retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    return {
      success: false,
      error: 'Unexpected error',
    };
  }

  private buildPayload(request: QwenRequest): Record<string, unknown> {
    const systemPrompt = this.getSystemPrompt(request.task);
    const userPrompt = this.getUserPrompt(request);

    return {
      model: autoActionConfig.qwenVL.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/png;base64,${request.image}` } },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
      max_tokens: autoActionConfig.qwenVL.maxTokens,
    };
  }

  private getSystemPrompt(task: QwenRequest['task']): string {
    const basePrompt = `You are Qwen2.5-VL, a vision-language AI specialized in UI understanding.
You analyze screenshots and extract structured information about UI elements, forms, and content.
Always respond in valid JSON format.`;

    const taskPrompts: Record<QwenRequest['task'], string> = {
      analyze_ui: `${basePrompt}
Analyze the UI layout, identify the page type, and describe the key elements and their relationships.`,
      detect_elements: `${basePrompt}
Detect all UI elements including buttons, inputs, links, images, and text.
For each element, provide its type, text/label, and bounding box coordinates (x, y, width, height).`,
      extract_form: `${basePrompt}
Extract all form fields from the screenshot.
For each field, identify its type, label, placeholder, whether it's required, and its location.`,
      ocr: `${basePrompt}
Perform optical character recognition on the screenshot.
Extract all visible text with confidence scores and bounding boxes.`,
      find_element: `${basePrompt}
Find the specific element described by the user and return its exact location on screen.`,
      describe: `${basePrompt}
Provide a natural language description of what you see on the screen.`,
    };

    return taskPrompts[task] || basePrompt;
  }

  private getUserPrompt(request: QwenRequest): string {
    const prompts: Record<QwenRequest['task'], string> = {
      analyze_ui: `Analyze this UI screenshot. Respond with JSON:
{
  "pageTitle": "string",
  "pageType": "form|list|dashboard|login|settings|document|unknown",
  "elements": [{"id": "string", "type": "string", "text": "string", "bounds": {"x": 0, "y": 0, "width": 0, "height": 0}}],
  "textContent": ["string"],
  "errors": ["string"],
  "warnings": ["string"]
}`,
      detect_elements: `Detect all UI elements. Respond with JSON:
{
  "elements": [
    {
      "id": "unique_id",
      "type": "button|input|link|text|image|checkbox|dropdown|form|unknown",
      "text": "visible text",
      "label": "associated label",
      "bounds": {"x": 0, "y": 0, "width": 0, "height": 0, "confidence": 0.0-1.0},
      "interactable": true/false
    }
  ]
}`,
      extract_form: `Extract form fields. Respond with JSON:
{
  "forms": [
    {
      "name": "field_name",
      "type": "text|email|password|number|date|select|checkbox|radio|file|textarea",
      "label": "field label",
      "placeholder": "placeholder text",
      "required": true/false,
      "currentValue": "current value if any",
      "options": ["for select/radio"],
      "bounds": {"x": 0, "y": 0, "width": 0, "height": 0, "confidence": 0.0-1.0}
    }
  ]
}`,
      ocr: `Extract all text with OCR. Respond with JSON:
{
  "ocrResults": [
    {"text": "string", "confidence": 0.0-1.0, "bounds": {"x": 0, "y": 0, "width": 0, "height": 0}}
  ]
}`,
      find_element: `Find this element: "${request.targetElement}". Respond with JSON:
{
  "found": true/false,
  "targetLocation": {"x": 0, "y": 0, "width": 0, "height": 0, "confidence": 0.0-1.0},
  "description": "what you found"
}`,
      describe: `${request.query ? `Question: ${request.query}\n\n` : ''}Describe what you see. Respond with JSON:
{
  "description": "detailed description of the screen"
}`,
    };

    return prompts[request.task];
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

      // Adjust endpoint based on provider
      let url = this.endpoint;
      if (!url.includes('/chat/completions') && !url.includes('/v1/')) {
        url = `${url}/v1/chat/completions`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Qwen VL API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseResponse(raw: unknown, task: QwenRequest['task']): QwenResponse {
    try {
      const data = raw as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, error: 'Could not parse response' };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const response: QwenResponse = {
        success: true,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined,
      };

      switch (task) {
        case 'analyze_ui':
          response.analysis = parsed;
          break;
        case 'detect_elements':
          response.elements = parsed.elements;
          break;
        case 'extract_form':
          response.forms = parsed.forms;
          break;
        case 'ocr':
          response.ocrResults = parsed.ocrResults;
          break;
        case 'find_element':
          response.targetLocation = parsed.targetLocation;
          response.description = parsed.description;
          break;
        case 'describe':
          response.description = parsed.description;
          break;
      }

      return response;
    } catch (error) {
      return {
        success: false,
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

let qwenClientInstance: QwenVisionClient | null = null;

export function getQwenVisionClient(options?: QwenClientOptions): QwenVisionClient {
  if (!qwenClientInstance) {
    qwenClientInstance = new QwenVisionClient(options);
  }
  return qwenClientInstance;
}

export default QwenVisionClient;
