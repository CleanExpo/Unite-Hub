/**
 * Markdown Processing Utilities
 * Handles parsing and transformation of markdown content
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { toString as mdastToString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import readingTime from 'reading-time';

/**
 * Plugin to extract the frontmatter from markdown content
 */
function extractFrontmatter() {
  return (tree: any, file: any) => {
    const frontmatterNode = tree.children.find(
      (node: any) => node.type === 'yaml'
    );
    
    if (frontmatterNode) {
      file.data.frontmatter = frontmatterNode.value;
      // Remove the frontmatter node
      tree.children = tree.children.filter(
        (node: any) => node !== frontmatterNode
      );
    }
  };
}

/**
 * Plugin to extract headings from markdown content
 */
function extractHeadings() {
  return (tree: any, file: any) => {
    const headings: Array<{ depth: number; value: string; id: string }> = [];
    
    visit(tree, 'heading', (node) => {
      const text = mdastToString(node);
      // Generate the ID that rehype-slug would generate
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      headings.push({
        depth: node.depth,
        value: text,
        id,
      });
    });
    
    file.data.headings = headings;
  };
}

/**
 * Parse markdown content to HTML
 * @param markdown The markdown content to parse
 * @returns Parsed HTML content
 */
export async function parseMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(extractFrontmatter)
    .use(extractHeadings)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: {
        className: ['anchor'],
        ariaHidden: true,
        tabIndex: -1,
      },
      content: {
        type: 'element',
        tagName: 'span',
        properties: {
          className: ['anchor-icon'],
        },
        children: [
          {
            type: 'text',
            value: '#',
          },
        ],
      },
    })
    .use(rehypePrism)
    .use(rehypeStringify)
    .process(markdown);
    
  return file.toString();
}

/**
 * Extract frontmatter from markdown content
 * @param markdown The markdown content
 * @returns The extracted frontmatter
 */
export async function extractMarkdownFrontmatter(markdown: string): Promise<Record<string, any>> {
  const file = await unified()
    .use(remarkParse)
    .use(extractFrontmatter)
    .use(remarkGfm)
    .process(markdown);
    
  return file.data.frontmatter || {};
}

/**
 * Extract headings from markdown content
 * @param markdown The markdown content
 * @returns Array of headings with depth, text value, and id
 */
export async function extractMarkdownHeadings(markdown: string): Promise<Array<{ depth: number; value: string; id: string }>> {
  const file = await unified()
    .use(remarkParse)
    .use(extractHeadings)
    .use(remarkGfm)
    .process(markdown);
    
  const headings = file.data.headings as Array<{ depth: number; value: string; id: string }> | undefined;
  return headings || [];
}

/**
 * Calculate reading time for markdown content
 * @param markdown The markdown content
 * @returns Reading time in minutes
 */
export function calculateReadingTime(markdown: string): number {
  const stats = readingTime(markdown);
  return Math.ceil(stats.minutes);
}

/**
 * Extract an excerpt from markdown content
 * @param markdown The markdown content
 * @param length The maximum length of the excerpt
 * @returns The excerpt
 */
export async function extractMarkdownExcerpt(markdown: string, length: number = 150): Promise<string> {
  // Remove frontmatter
  const content = markdown.replace(/---[\s\S]*?---/, '').trim();
  
  // Convert to text
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .process(content);
  
  const text = mdastToString(file);
  
  // Truncate to length
  if (text.length <= length) {
    return text;
  }
  
  return text.slice(0, length).trim() + '...';
}
