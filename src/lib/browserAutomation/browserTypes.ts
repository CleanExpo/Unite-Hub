/**
 * Browser Automation Types
 *
 * Types for browser sessions, DOM maps, replay tasks, and learned patterns.
 */

export type SessionStatus = 'active' | 'paused' | 'ended' | 'error';

export type ActionType =
  | 'navigate'
  | 'click'
  | 'type'
  | 'scroll'
  | 'hover'
  | 'select'
  | 'wait'
  | 'screenshot'
  | 'evaluate'
  | 'upload'
  | 'download'
  | 'cookie_set'
  | 'cookie_clear'
  | 'storage_set'
  | 'storage_clear';

export type ReplayStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type PatternStatus = 'learning' | 'active' | 'deprecated';

export type PatternCategory =
  | 'login'
  | 'form_fill'
  | 'navigation'
  | 'data_extraction'
  | 'pagination'
  | 'search'
  | 'filter'
  | 'export'
  | 'upload'
  | 'custom';

export interface BrowserSession {
  id: string;
  workspaceId: string;
  userId?: string;
  name: string;
  targetUrl: string;
  status: SessionStatus;
  browserType: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  userAgent?: string;
  cookies?: BrowserCookie[];
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  currentUrl?: string;
  lastActivityAt?: Date;
  errorMessage?: string;
  stateEncrypted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface DomMap {
  id: string;
  sessionId: string;
  workspaceId: string;
  url: string;
  urlHash: string;
  domTree: DomNode;
  interactiveElements: InteractiveElement[];
  forms: FormInfo[];
  links: LinkInfo[];
  mediaElements: MediaElement[];
  capturedAt: Date;
  expiresAt: Date;
  sizeBytes?: number;
  createdAt: Date;
}

export interface DomNode {
  tag: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  text?: string;
  xpath: string;
  cssSelector: string;
  rect?: { x: number; y: number; width: number; height: number };
  children?: DomNode[];
}

export interface InteractiveElement {
  type: 'button' | 'link' | 'input' | 'select' | 'checkbox' | 'radio' | 'textarea';
  xpath: string;
  cssSelector: string;
  text?: string;
  name?: string;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled: boolean;
  visible: boolean;
  rect: { x: number; y: number; width: number; height: number };
}

export interface FormInfo {
  action?: string;
  method?: string;
  xpath: string;
  fields: FormField[];
}

export interface FormField {
  type: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  required: boolean;
  xpath: string;
  cssSelector: string;
}

export interface LinkInfo {
  href: string;
  text?: string;
  isExternal: boolean;
  xpath: string;
  cssSelector: string;
}

export interface MediaElement {
  type: 'image' | 'video' | 'audio' | 'iframe';
  src?: string;
  alt?: string;
  xpath: string;
  cssSelector: string;
}

export interface ReplayTask {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  startUrl: string;
  steps: ReplayStep[];
  variables?: Record<string, ReplayVariable>;
  assertions?: ReplayAssertion[];
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
    continueOnFail: boolean;
  };
  scheduleConfig?: {
    enabled: boolean;
    cron?: string;
    timezone?: string;
  };
  notifyOnComplete: boolean;
  notifyOnFail: boolean;
  createdBy?: string;
  lastRunAt?: Date;
  lastRunStatus?: ReplayStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplayStep {
  order: number;
  action: ActionType;
  target?: {
    xpath?: string;
    cssSelector?: string;
    text?: string;
    ariaLabel?: string;
  };
  value?: string;
  variable?: string;
  waitMs?: number;
  timeout?: number;
  screenshot?: boolean;
  optional?: boolean;
  description?: string;
}

export interface ReplayVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'json';
  defaultValue?: unknown;
  source?: 'input' | 'extracted' | 'env';
  extractSelector?: string;
  extractAttribute?: string;
}

export interface ReplayAssertion {
  type: 'element_exists' | 'element_visible' | 'text_contains' | 'url_matches' | 'cookie_exists' | 'custom';
  target?: string;
  value?: string;
  message?: string;
}

export interface ReplayRun {
  id: string;
  taskId: string;
  workspaceId: string;
  status: ReplayStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  stepResults: StepResult[];
  extractedData?: Record<string, unknown>;
  screenshotUrls?: string[];
  errorMessage?: string;
  errorStep?: number;
  retryCount: number;
  triggeredBy: 'manual' | 'schedule' | 'api';
  createdAt: Date;
}

export interface StepResult {
  stepOrder: number;
  action: ActionType;
  status: 'success' | 'failed' | 'skipped';
  durationMs: number;
  screenshotUrl?: string;
  extractedValue?: unknown;
  errorMessage?: string;
}

export interface LearnedPattern {
  id: string;
  workspaceId: string;
  name: string;
  category: PatternCategory;
  description?: string;
  domain?: string;
  urlPattern?: string;
  steps: PatternStep[];
  successRate: number;
  usageCount: number;
  lastUsedAt?: Date;
  status: PatternStatus;
  confidence: number;
  variableFields?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatternStep {
  order: number;
  action: ActionType;
  selectorStrategies: SelectorStrategy[];
  valuePattern?: string;
  isVariable: boolean;
  variableName?: string;
  waitCondition?: string;
}

export interface SelectorStrategy {
  type: 'xpath' | 'css' | 'text' | 'aria' | 'id' | 'name';
  value: string;
  confidence: number;
  lastSuccessAt?: Date;
}

export interface BrowserActionLog {
  id: string;
  sessionId: string;
  workspaceId: string;
  action: ActionType;
  target?: string;
  value?: string;
  result: 'success' | 'failed';
  durationMs: number;
  screenshotBefore?: string;
  screenshotAfter?: string;
  domChanges?: DomChange[];
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  performedAt: Date;
  createdAt: Date;
}

export interface DomChange {
  type: 'added' | 'removed' | 'modified';
  xpath: string;
  oldValue?: string;
  newValue?: string;
}

// Helper types for state encryption
export interface EncryptedState {
  data: string;
  iv: string;
  authTag: string;
}

export interface SessionState {
  cookies: BrowserCookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  currentUrl: string;
  viewport: { width: number; height: number };
}
