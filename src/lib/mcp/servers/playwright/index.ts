/**
 * Playwright MCP Server - Code Execution API
 *
 * TypeScript wrapper for the Playwright MCP server.
 * Use this for browser automation without loading all tool definitions.
 *
 * @example
 * import * as playwright from '@/lib/mcp/servers/playwright';
 *
 * // Navigate and take screenshot
 * await playwright.navigate({ url: 'https://example.com' });
 * const screenshot = await playwright.takeScreenshot({ fullPage: true });
 *
 * // Fill form efficiently
 * await playwright.fillForm({
 *   fields: [
 *     { name: 'email', type: 'textbox', ref: 'input#email', value: 'test@example.com' },
 *     { name: 'password', type: 'textbox', ref: 'input#password', value: 'secret' }
 *   ]
 * });
 */

import { callMCPTool } from '../../client';

const SERVER_NAME = 'playwright';

// ========================================================================
// Type Definitions
// ========================================================================

export interface NavigateInput {
  url: string;
}

export interface ClickInput {
  element: string;
  ref: string;
  button?: 'left' | 'right' | 'middle';
  doubleClick?: boolean;
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

export interface TypeInput {
  element: string;
  ref: string;
  text: string;
  slowly?: boolean;
  submit?: boolean;
}

export interface ScreenshotInput {
  filename?: string;
  fullPage?: boolean;
  element?: string;
  ref?: string;
  type?: 'png' | 'jpeg';
}

export interface FormField {
  name: string;
  type: 'textbox' | 'checkbox' | 'radio' | 'combobox' | 'slider';
  ref: string;
  value: string;
}

export interface FillFormInput {
  fields: FormField[];
}

export interface WaitForInput {
  text?: string;
  textGone?: string;
  time?: number;
}

export interface SelectOptionInput {
  element: string;
  ref: string;
  values: string[];
}

export interface EvaluateInput {
  function: string;
  element?: string;
  ref?: string;
}

// ========================================================================
// Core Browser Functions
// ========================================================================

/**
 * Navigate to a URL
 */
export async function navigate(input: NavigateInput): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_navigate', input);
}

/**
 * Navigate back to previous page
 */
export async function navigateBack(): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_navigate_back', {});
}

/**
 * Get accessibility snapshot of current page
 */
export async function snapshot(): Promise<string> {
  const result = await callMCPTool<string>(SERVER_NAME, 'browser_snapshot', {});
  return result;
}

/**
 * Take a screenshot
 */
export async function takeScreenshot(input?: ScreenshotInput): Promise<string> {
  const result = await callMCPTool<string>(
    SERVER_NAME,
    'browser_take_screenshot',
    input || {}
  );
  return result;
}

/**
 * Close the browser
 */
export async function close(): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_close', {});
}

/**
 * Resize browser window
 */
export async function resize(width: number, height: number): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_resize', { width, height });
}

// ========================================================================
// Interaction Functions
// ========================================================================

/**
 * Click an element
 */
export async function click(input: ClickInput): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_click', input);
}

/**
 * Type text into an element
 */
export async function type(input: TypeInput): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_type', input);
}

/**
 * Fill multiple form fields at once
 */
export async function fillForm(input: FillFormInput): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_fill_form', input);
}

/**
 * Press a key
 */
export async function pressKey(key: string): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_press_key', { key });
}

/**
 * Hover over an element
 */
export async function hover(element: string, ref: string): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_hover', { element, ref });
}

/**
 * Select option in dropdown
 */
export async function selectOption(input: SelectOptionInput): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_select_option', input);
}

/**
 * Upload files
 */
export async function uploadFiles(paths?: string[]): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_file_upload', { paths });
}

/**
 * Drag and drop
 */
export async function drag(
  startElement: string,
  startRef: string,
  endElement: string,
  endRef: string
): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_drag', {
    startElement,
    startRef,
    endElement,
    endRef,
  });
}

// ========================================================================
// Wait & Evaluate Functions
// ========================================================================

/**
 * Wait for text, text to disappear, or time
 */
export async function waitFor(input: WaitForInput): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_wait_for', input);
}

/**
 * Evaluate JavaScript on page
 */
export async function evaluate<T = unknown>(input: EvaluateInput): Promise<T> {
  return callMCPTool<T>(SERVER_NAME, 'browser_evaluate', input);
}

/**
 * Handle dialog (alert, confirm, prompt)
 */
export async function handleDialog(
  accept: boolean,
  promptText?: string
): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_handle_dialog', {
    accept,
    promptText,
  });
}

// ========================================================================
// Tab Management
// ========================================================================

/**
 * List all tabs
 */
export async function listTabs(): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'browser_tabs', { action: 'list' });
}

/**
 * Create new tab
 */
export async function newTab(): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_tabs', { action: 'new' });
}

/**
 * Close tab (current if no index provided)
 */
export async function closeTab(index?: number): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_tabs', { action: 'close', index });
}

/**
 * Select tab by index
 */
export async function selectTab(index: number): Promise<void> {
  await callMCPTool(SERVER_NAME, 'browser_tabs', { action: 'select', index });
}

// ========================================================================
// Debug Functions
// ========================================================================

/**
 * Get console messages
 */
export async function getConsoleMessages(
  onlyErrors?: boolean
): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'browser_console_messages', {
    onlyErrors,
  });
}

/**
 * Get network requests
 */
export async function getNetworkRequests(): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'browser_network_requests', {});
}

// ========================================================================
// Convenience Functions (Context-Efficient Patterns)
// ========================================================================

/**
 * Login to a site - single call instead of multiple tool calls
 *
 * @example
 * await login('https://example.com/login', 'user@email.com', 'password');
 */
export async function login(
  url: string,
  email: string,
  password: string,
  emailRef = 'input[type="email"]',
  passwordRef = 'input[type="password"]',
  submitRef = 'button[type="submit"]'
): Promise<void> {
  await navigate({ url });
  await waitFor({ time: 1 });
  await fillForm({
    fields: [
      { name: 'email', type: 'textbox', ref: emailRef, value: email },
      { name: 'password', type: 'textbox', ref: passwordRef, value: password },
    ],
  });
  await click({ element: 'Submit button', ref: submitRef });
}

/**
 * Check page for specific text and return boolean
 * (filters in code instead of passing full snapshot through context)
 */
export async function hasText(searchText: string): Promise<boolean> {
  const snap = await snapshot();
  return snap.toLowerCase().includes(searchText.toLowerCase());
}

/**
 * Get all console errors (filtered in code)
 */
export async function getErrors(): Promise<string[]> {
  const messages = (await getConsoleMessages(true)) as Array<{ text?: string }>;
  return messages.map((m) => m.text || '').filter(Boolean);
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(expectedUrl: string, timeout = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const snap = await snapshot();
    if (snap.includes(expectedUrl)) {
      return true;
    }
    await waitFor({ time: 0.5 });
  }
  return false;
}
