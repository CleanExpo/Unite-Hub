/**
 * Obsidian Markdown — YAML frontmatter serialiser/parser
 *
 * Uses gray-matter to parse/stringify YAML frontmatter in .md files.
 * All dates are formatted as ISO strings. Tags are always arrays.
 */

import matter from 'gray-matter';

export interface NoteFrontmatter {
  type: string;
  crm_id?: string;
  name?: string;
  email?: string;
  business?: string;
  phone?: string;
  last_interaction?: string;
  tags?: string[];
  crm_link?: string;
  date?: string;
  [key: string]: unknown;
}

/**
 * Parse a .md file string into frontmatter + body.
 */
export function parseNote(raw: string): { frontmatter: NoteFrontmatter; body: string } {
  const parsed = matter(raw);
  return {
    frontmatter: parsed.data as NoteFrontmatter,
    body: parsed.content.trim(),
  };
}

/**
 * Serialise frontmatter + body into a .md file string.
 */
export function stringifyNote(frontmatter: NoteFrontmatter, body: string): string {
  return matter.stringify(body, frontmatter);
}

/**
 * Merge new frontmatter into an existing note, preserving the body.
 * Existing frontmatter keys are overwritten; body is kept as-is.
 */
export function mergeNote(
  raw: string,
  newFrontmatter: Partial<NoteFrontmatter>,
): string {
  const { frontmatter, body } = parseNote(raw);
  const merged: NoteFrontmatter = { ...frontmatter, ...newFrontmatter };
  return stringifyNote(merged, body);
}

/**
 * Sanitise a string for use as a safe file name.
 * Removes/replaces characters that Obsidian or Google Drive disallows.
 */
export function toSafeFileName(name: string): string {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')  // replace unsafe chars
    .replace(/\s+/g, ' ')            // collapse whitespace
    .slice(0, 200);                  // cap length
}
