/**
 * OpenAI Responses API - TypeScript Types
 * Based on OpenAI API Documentation
 * https://platform.openai.com/docs/api-reference/responses
 */

// ============================================================================
// Request Types
// ============================================================================

export interface CreateResponseRequest {
  /** Model ID to use (e.g., "gpt-4o", "gpt-5", "o3") */
  model: string;

  /** Text, image, or file inputs to the model */
  input?: string | InputItem[];

  /** System/developer message inserted into context */
  instructions?: string;

  /** Whether to run response in background */
  background?: boolean;

  /** Conversation ID or object */
  conversation?: string | ConversationObject;

  /** Previous response ID for multi-turn conversations */
  previous_response_id?: string;

  /** Maximum output tokens (including reasoning) */
  max_output_tokens?: number;

  /** Maximum tool calls allowed */
  max_tool_calls?: number;

  /** Temperature (0-2) */
  temperature?: number;

  /** Top-p sampling */
  top_p?: number;

  /** Tools available to the model */
  tools?: Tool[];

  /** How model should select tools */
  tool_choice?: string | ToolChoice;

  /** Allow parallel tool calls */
  parallel_tool_calls?: boolean;

  /** Text format configuration */
  text?: TextConfig;

  /** Reasoning configuration (gpt-5/o-series) */
  reasoning?: ReasoningConfig;

  /** Stream response */
  stream?: boolean;

  /** Stream options */
  stream_options?: StreamOptions;

  /** Truncation strategy */
  truncation?: 'auto' | 'disabled';

  /** Store response for later retrieval */
  store?: boolean;

  /** Metadata (max 16 key-value pairs) */
  metadata?: Record<string, string>;

  /** Additional output data to include */
  include?: string[];

  /** Service tier */
  service_tier?: 'auto' | 'default' | 'flex' | 'priority';

  /** Safety identifier */
  safety_identifier?: string;

  /** Prompt reference */
  prompt?: PromptReference;

  /** Prompt cache key */
  prompt_cache_key?: string;

  /** Prompt cache retention */
  prompt_cache_retention?: '24h';

  /** Top logprobs count (0-20) */
  top_logprobs?: number;

  /** @deprecated Use safety_identifier or prompt_cache_key */
  user?: string;
}

export interface ConversationObject {
  id?: string;
  metadata?: Record<string, string>;
}

export interface InputItem {
  type: 'message' | 'function_call_output' | 'tool_call_output';
  role?: 'user' | 'assistant' | 'system';
  content?: ContentItem[];
  [key: string]: any;
}

export interface ContentItem {
  type: 'input_text' | 'input_image' | 'output_text';
  text?: string;
  image_url?: string | ImageUrlObject;
  [key: string]: any;
}

export interface ImageUrlObject {
  url: string;
  detail?: 'low' | 'high' | 'auto';
}

export interface Tool {
  type: 'function' | 'file_search' | 'web_search' | 'code_interpreter' | 'computer';
  function?: FunctionDefinition;
  [key: string]: any;
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  strict?: boolean;
}

export interface ToolChoice {
  type: 'function';
  function: {
    name: string;
  };
}

export interface TextConfig {
  format?: {
    type: 'text' | 'json_object' | 'json_schema';
    json_schema?: {
      name: string;
      description?: string;
      schema: Record<string, any>;
      strict?: boolean;
    };
  };
}

export interface ReasoningConfig {
  effort?: 'low' | 'medium' | 'high';
  summary?: boolean;
}

export interface StreamOptions {
  include_usage?: boolean;
}

export interface PromptReference {
  id: string;
  variables?: Record<string, any>;
}

// ============================================================================
// Response Types
// ============================================================================

export interface Response {
  /** Unique response ID */
  id: string;

  /** Object type - always "response" */
  object: 'response';

  /** Unix timestamp of creation */
  created_at: number;

  /** Response status */
  status: 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'queued' | 'incomplete';

  /** Error object if failed */
  error: ResponseError | null;

  /** Incomplete details */
  incomplete_details: IncompleteDetails | null;

  /** Instructions used */
  instructions: string | string[] | null;

  /** Max output tokens */
  max_output_tokens: number | null;

  /** Max tool calls */
  max_tool_calls: number | null;

  /** Model used */
  model: string;

  /** Output items */
  output: OutputItem[];

  /** SDK-only: Aggregated text output */
  output_text?: string;

  /** Parallel tool calls enabled */
  parallel_tool_calls: boolean;

  /** Previous response ID */
  previous_response_id: string | null;

  /** Reasoning configuration */
  reasoning: {
    effort: string | null;
    summary: string | null;
  };

  /** Whether response is stored */
  store: boolean;

  /** Temperature used */
  temperature: number;

  /** Text configuration */
  text: TextConfig;

  /** Tool choice */
  tool_choice: string | ToolChoice;

  /** Tools used */
  tools: Tool[];

  /** Top-p used */
  top_p: number;

  /** Top logprobs */
  top_logprobs: number | null;

  /** Truncation strategy */
  truncation: 'auto' | 'disabled';

  /** Token usage */
  usage: Usage;

  /** User identifier */
  user: string | null;

  /** Metadata */
  metadata: Record<string, string>;

  /** Background processing */
  background: boolean;

  /** Conversation */
  conversation: ConversationObject | null;

  /** Prompt reference */
  prompt: PromptReference | null;

  /** Service tier */
  service_tier: string;

  /** Safety identifier */
  safety_identifier: string | null;

  /** Prompt cache key */
  prompt_cache_key: string | null;

  /** Prompt cache retention */
  prompt_cache_retention: string | null;
}

export interface ResponseError {
  code: string;
  message: string;
  param?: string;
  type?: string;
}

export interface IncompleteDetails {
  reason: 'max_output_tokens' | 'max_tool_calls' | 'content_filter';
}

export interface OutputItem {
  type: 'message' | 'tool_call' | 'function_call' | 'reasoning';
  id: string;
  status: 'completed' | 'failed' | 'in_progress';
  role?: 'assistant' | 'user';
  content?: ContentOutputItem[];
  [key: string]: any;
}

export interface ContentOutputItem {
  type: 'output_text' | 'tool_call' | 'function_call';
  text?: string;
  annotations?: Annotation[];
  logprobs?: LogProbs[];
  [key: string]: any;
}

export interface Annotation {
  type: string;
  text: string;
  [key: string]: any;
}

export interface LogProbs {
  token: string;
  logprob: number;
  top_logprobs: Array<{ token: string; logprob: number }>;
}

export interface Usage {
  input_tokens: number;
  input_tokens_details: {
    cached_tokens: number;
  };
  output_tokens: number;
  output_tokens_details: {
    reasoning_tokens: number;
  };
  total_tokens: number;
}

// ============================================================================
// Other API Types
// ============================================================================

export interface GetResponseRequest {
  response_id: string;
  include?: string[];
  include_obfuscation?: boolean;
  starting_after?: number;
  stream?: boolean;
}

export interface DeleteResponseRequest {
  response_id: string;
}

export interface DeleteResponseResponse {
  id: string;
  object: 'response';
  deleted: true;
}

export interface CancelResponseRequest {
  response_id: string;
}

export interface CompactResponseRequest {
  model: string;
  input?: string | InputItem[];
  instructions?: string;
  previous_response_id?: string;
}

export interface CompactedResponse {
  id: string;
  object: 'response.compaction';
  created_at: number;
  output: Array<InputItem | CompactionItem>;
  usage: Usage;
}

export interface CompactionItem {
  type: 'compaction';
  id: string;
  encrypted_content: string;
}

export interface ListInputItemsRequest {
  response_id: string;
  after?: string;
  limit?: number;
  order?: 'asc' | 'desc';
  include?: string[];
}

export interface InputItemList {
  object: 'list';
  data: InputItem[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

export interface GetInputTokenCountsRequest {
  model: string;
  input?: string | InputItem[];
  instructions?: string;
  conversation?: string | ConversationObject;
  previous_response_id?: string;
  reasoning?: ReasoningConfig;
  text?: TextConfig;
  tool_choice?: string | ToolChoice;
  tools?: Tool[];
  truncation?: 'auto' | 'disabled';
  parallel_tool_calls?: boolean;
}

export interface InputTokenCountsResponse {
  object: 'response.input_tokens';
  input_tokens: number;
}

// ============================================================================
// Stream Types
// ============================================================================

export interface StreamEvent {
  event: string;
  data: any;
}

export interface StreamDelta {
  type: 'delta';
  id: string;
  delta: Partial<Response>;
}

// ============================================================================
// Helper Types
// ============================================================================

export type ResponseStatus = Response['status'];
export type TruncationStrategy = 'auto' | 'disabled';
export type ServiceTier = 'auto' | 'default' | 'flex' | 'priority';
