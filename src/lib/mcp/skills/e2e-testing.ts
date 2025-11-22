/**
 * E2E Testing Skill
 *
 * Reusable end-to-end testing patterns using Playwright MCP.
 * These functions execute in code to minimize context token usage.
 *
 * @example
 * import { testLoginFlow, testFormSubmission } from '@/lib/mcp/skills/e2e-testing';
 *
 * const result = await testLoginFlow({
 *   url: 'https://app.example.com/login',
 *   email: 'test@example.com',
 *   password: 'testpass123',
 *   successIndicator: 'Dashboard'
 * });
 */

import * as playwright from '../servers/playwright';

export interface TestResult {
  passed: boolean;
  duration: number;
  errors: string[];
  screenshots?: string[];
}

export interface LoginTestConfig {
  url: string;
  email: string;
  password: string;
  emailSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  successIndicator: string;
  captureScreenshots?: boolean;
}

export interface FormTestConfig {
  url: string;
  fields: Array<{
    name: string;
    selector: string;
    value: string;
    type?: 'text' | 'select' | 'checkbox';
  }>;
  submitSelector: string;
  successIndicator: string;
  captureScreenshots?: boolean;
}

/**
 * Test login flow
 *
 * Complete login test that executes in code without
 * passing intermediate results through context.
 */
export async function testLoginFlow(
  config: LoginTestConfig
): Promise<TestResult> {
  const start = Date.now();
  const errors: string[] = [];
  const screenshots: string[] = [];

  try {
    // Navigate to login page
    await playwright.navigate({ url: config.url });
    await playwright.waitFor({ time: 1 });

    if (config.captureScreenshots) {
      const ss = await playwright.takeScreenshot({ filename: 'login-page.png' });
      screenshots.push(ss);
    }

    // Fill login form
    await playwright.fillForm({
      fields: [
        {
          name: 'email',
          type: 'textbox',
          ref: config.emailSelector || 'input[type="email"]',
          value: config.email,
        },
        {
          name: 'password',
          type: 'textbox',
          ref: config.passwordSelector || 'input[type="password"]',
          value: config.password,
        },
      ],
    });

    // Submit form
    await playwright.click({
      element: 'Submit button',
      ref: config.submitSelector || 'button[type="submit"]',
    });

    // Wait for navigation
    await playwright.waitFor({ time: 2 });

    // Check for success
    const hasSuccess = await playwright.hasText(config.successIndicator);

    if (!hasSuccess) {
      errors.push(`Success indicator "${config.successIndicator}" not found`);

      // Check for error messages
      const consoleErrors = await playwright.getErrors();
      if (consoleErrors.length > 0) {
        errors.push(...consoleErrors.slice(0, 5));
      }
    }

    if (config.captureScreenshots) {
      const ss = await playwright.takeScreenshot({ filename: 'login-result.png' });
      screenshots.push(ss);
    }

    return {
      passed: errors.length === 0,
      duration: Date.now() - start,
      errors,
      screenshots: config.captureScreenshots ? screenshots : undefined,
    };
  } catch (error) {
    errors.push(`Test error: ${(error as Error).message}`);
    return {
      passed: false,
      duration: Date.now() - start,
      errors,
      screenshots: config.captureScreenshots ? screenshots : undefined,
    };
  }
}

/**
 * Test form submission
 *
 * Generic form submission test.
 */
export async function testFormSubmission(
  config: FormTestConfig
): Promise<TestResult> {
  const start = Date.now();
  const errors: string[] = [];
  const screenshots: string[] = [];

  try {
    await playwright.navigate({ url: config.url });
    await playwright.waitFor({ time: 1 });

    // Fill all fields
    const formFields = config.fields.map((field) => ({
      name: field.name,
      type: (field.type === 'select' ? 'combobox' : 'textbox') as
        | 'textbox'
        | 'checkbox'
        | 'radio'
        | 'combobox'
        | 'slider',
      ref: field.selector,
      value: field.value,
    }));

    await playwright.fillForm({ fields: formFields });

    if (config.captureScreenshots) {
      const ss = await playwright.takeScreenshot({ filename: 'form-filled.png' });
      screenshots.push(ss);
    }

    // Submit
    await playwright.click({
      element: 'Submit button',
      ref: config.submitSelector,
    });

    await playwright.waitFor({ time: 2 });

    // Check for success
    const hasSuccess = await playwright.hasText(config.successIndicator);

    if (!hasSuccess) {
      errors.push(`Success indicator "${config.successIndicator}" not found`);
    }

    return {
      passed: errors.length === 0,
      duration: Date.now() - start,
      errors,
      screenshots: config.captureScreenshots ? screenshots : undefined,
    };
  } catch (error) {
    errors.push(`Test error: ${(error as Error).message}`);
    return {
      passed: false,
      duration: Date.now() - start,
      errors,
    };
  }
}

/**
 * Visual regression check
 *
 * Takes screenshots of key pages for comparison.
 */
export async function visualRegressionCheck(
  pages: Array<{ name: string; url: string }>
): Promise<{
  screenshots: Array<{ name: string; path: string }>;
  errors: string[];
}> {
  const screenshots: Array<{ name: string; path: string }> = [];
  const errors: string[] = [];

  for (const page of pages) {
    try {
      await playwright.navigate({ url: page.url });
      await playwright.waitFor({ time: 2 });

      const filename = `visual-${page.name.replace(/\s+/g, '-')}.png`;
      const path = await playwright.takeScreenshot({
        filename,
        fullPage: true,
      });

      screenshots.push({ name: page.name, path });
    } catch (error) {
      errors.push(`Failed to capture ${page.name}: ${(error as Error).message}`);
    }
  }

  return { screenshots, errors };
}

/**
 * Accessibility check
 *
 * Basic accessibility audit using console errors and evaluation.
 */
export async function accessibilityCheck(url: string): Promise<{
  issues: string[];
  warnings: string[];
}> {
  await playwright.navigate({ url });
  await playwright.waitFor({ time: 1 });

  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for images without alt
  const missingAlt = await playwright.evaluate<number>({
    function: `() => document.querySelectorAll('img:not([alt])').length`,
  });

  if (missingAlt > 0) {
    issues.push(`${missingAlt} images missing alt text`);
  }

  // Check for form inputs without labels
  const missingLabels = await playwright.evaluate<number>({
    function: `() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
      let count = 0;
      inputs.forEach(input => {
        const id = input.id;
        if (!id || !document.querySelector('label[for="' + id + '"]')) {
          count++;
        }
      });
      return count;
    }`,
  });

  if (missingLabels > 0) {
    warnings.push(`${missingLabels} form inputs may be missing associated labels`);
  }

  // Check for low contrast (basic check)
  const smallText = await playwright.evaluate<number>({
    function: `() => {
      const elements = document.querySelectorAll('p, span, a, li');
      let count = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 12) count++;
      });
      return count;
    }`,
  });

  if (smallText > 10) {
    warnings.push(`${smallText} elements with font size below 12px`);
  }

  return { issues, warnings };
}

/**
 * Performance check
 *
 * Basic performance metrics from the browser.
 */
export async function performanceCheck(url: string): Promise<{
  loadTime: number;
  domElements: number;
  jsHeapSize: number;
  recommendations: string[];
}> {
  await playwright.navigate({ url });
  await playwright.waitFor({ time: 2 });

  const metrics = await playwright.evaluate<{
    loadTime: number;
    domElements: number;
    jsHeapSize: number;
  }>({
    function: `() => {
      const perf = performance.timing;
      return {
        loadTime: perf.loadEventEnd - perf.navigationStart,
        domElements: document.getElementsByTagName('*').length,
        jsHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 0
      };
    }`,
  });

  const recommendations: string[] = [];

  if (metrics.loadTime > 3000) {
    recommendations.push('Page load time exceeds 3s - optimize critical render path');
  }

  if (metrics.domElements > 1500) {
    recommendations.push(
      `${metrics.domElements} DOM elements - consider virtualization or lazy loading`
    );
  }

  if (metrics.jsHeapSize > 50 * 1024 * 1024) {
    recommendations.push('High JS heap usage - check for memory leaks');
  }

  return {
    ...metrics,
    recommendations,
  };
}
