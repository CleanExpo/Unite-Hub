/**
 * Input Sanitization Tests
 * Tests for sanitizeString and sanitizeObject utilities.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeObject } from '@/lib/sanitize';

describe('sanitizeString', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString({})).toBe('');
    expect(sanitizeString([])).toBe('');
    expect(sanitizeString(true)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('should pass through clean strings', () => {
    expect(sanitizeString('Hello World')).toBe('Hello World');
    expect(sanitizeString('John Doe')).toBe('John Doe');
    expect(sanitizeString('test@example.com')).toBe('test@example.com');
  });

  it('should strip HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert(&quot;xss&quot;)');
    expect(sanitizeString('<b>bold</b>')).toBe('bold');
    expect(sanitizeString('Hello <img src=x onerror=alert(1)> World')).toBe('Hello  World');
    expect(sanitizeString('<div onclick="evil()">Click</div>')).toBe('Click');
  });

  it('should encode dangerous characters', () => {
    expect(sanitizeString('a & b')).toBe('a &amp; b');
    expect(sanitizeString('a < b')).toBe('a &lt; b');
    expect(sanitizeString('a > b')).toBe('a &gt; b');
    expect(sanitizeString('say "hello"')).toBe('say &quot;hello&quot;');
    expect(sanitizeString("it's")).toBe('it&#x27;s');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('\n\tspaced\n\t')).toBe('spaced');
  });

  it('should enforce max length', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeString(long).length).toBe(1000);
    expect(sanitizeString(long, 50).length).toBe(50);
  });

  it('should handle custom max length', () => {
    expect(sanitizeString('Hello World', 5)).toBe('Hello');
  });

  it('should handle combined XSS vectors', () => {
    const xss = '<script>document.cookie</script><img src=x onerror=alert(1)>';
    const result = sanitizeString(xss);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });
});

describe('sanitizeObject', () => {
  it('should sanitize specified string fields', () => {
    const input = { name: '<b>John</b>', email: 'john@example.com', age: 30 };
    const result = sanitizeObject(input, ['name', 'email']);
    expect(result.name).toBe('John');
    expect(result.email).toBe('john@example.com');
    expect(result.age).toBe(30);
  });

  it('should not modify non-string fields even if specified', () => {
    const input = { name: 'John', count: 5, active: true };
    const result = sanitizeObject(input, ['name', 'count' as any, 'active' as any]);
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
  });

  it('should leave unspecified fields untouched', () => {
    const input = { name: '<b>John</b>', bio: '<script>xss</script>' };
    const result = sanitizeObject(input, ['name']);
    expect(result.name).toBe('John');
    expect(result.bio).toBe('<script>xss</script>');
  });

  it('should apply custom max length', () => {
    const input = { name: 'a'.repeat(200) };
    const result = sanitizeObject(input, ['name'], 50);
    expect(result.name.length).toBe(50);
  });

  it('should not mutate original object', () => {
    const input = { name: '<b>John</b>' };
    const result = sanitizeObject(input, ['name']);
    expect(input.name).toBe('<b>John</b>');
    expect(result.name).toBe('John');
  });

  it('should handle empty object', () => {
    const result = sanitizeObject({}, []);
    expect(result).toEqual({});
  });

  it('should handle missing fields gracefully', () => {
    const input = { name: 'John' };
    const result = sanitizeObject(input, ['name', 'email' as any]);
    expect(result.name).toBe('John');
  });
});
