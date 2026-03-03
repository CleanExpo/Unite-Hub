# Markdown Processor

> Parse, transform, and render Markdown with plugins, syntax highlighting, and custom components for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `markdown-processor`                                     |
| **Category**   | Document & Content                                       |
| **Complexity** | Low                                                      |
| **Complements**| `data-transform`, `search-indexer`, `scientific-luxury`  |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies Markdown processing patterns for NodeJS-Starter-V1: unified/remark/rehype pipeline for parsing and transforming Markdown, MDX support for embedding React components, syntax highlighting with Shiki, custom remark plugins for project-specific extensions, and server-side rendering for Next.js pages.

---

## When to Apply

### Positive Triggers

- Rendering user-generated Markdown content in the frontend
- Building documentation or blog pages from `.md`/`.mdx` files
- Adding syntax highlighting to code blocks in rendered content
- Creating custom Markdown extensions (e.g., admonitions, callouts)
- Processing Markdown in workflow node descriptions or agent outputs

### Negative Triggers

- CSV or tabular data parsing (use `csv-processor` skill)
- Full-text search indexing of content (use `search-indexer` skill)
- Email template rendering (use `email-template` skill)
- Data transformation pipelines (use `data-transform` skill)

---

## Core Principles

### The Three Laws of Markdown Processing

1. **Unified Pipeline**: Always use the unified ecosystem (remark for Markdown, rehype for HTML). Never use regex-based Markdown parsing — it cannot handle edge cases.
2. **Sanitise User Content**: Any user-provided Markdown must be sanitised with `rehype-sanitize` before rendering. Unsanitised Markdown is an XSS vector.
3. **Server-Side by Default**: Render Markdown on the server (RSC or API route). Client-side rendering wastes bundle size on parsing libraries the user doesn't need.

---

## Pattern 1: Unified Pipeline (Next.js)

### Server-Side Markdown Rendering

```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";

async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)           // Tables, strikethrough, task lists
    .use(remarkRehype)
    .use(rehypeSanitize)       // XSS prevention
    .use(rehypeShiki, {
      theme: "github-dark",
    })
    .use(rehypeStringify)
    .process(content);

  return String(result);
}
```

**Project Reference**: `apps/web/components/workflow/nodes/workflow-node.tsx` — workflow nodes display Markdown descriptions. Currently rendered as plain text. Replace with `renderMarkdown()` for rich formatting.

---

## Pattern 2: MDX for Interactive Content

### React Components in Markdown

```typescript
import { compileMDX } from "next-mdx-remote/rsc";

interface MDXComponents {
  [key: string]: React.ComponentType<Record<string, unknown>>;
}

const components: MDXComponents = {
  Callout: ({ type, children }: { type: string; children: React.ReactNode }) => (
    <div className={`border-l-2 pl-4 my-4 ${
      type === "warning" ? "border-[#FFB800]" : "border-[#00F5FF]"
    }`}>
      {children}
    </div>
  ),
  CodeDemo: ({ code }: { code: string }) => (
    <pre className="rounded-sm bg-white/[0.03] p-4 font-mono text-sm">
      <code>{code}</code>
    </pre>
  ),
};

async function renderMDX(source: string) {
  const { content, frontmatter } = await compileMDX({
    source,
    components,
    options: { parseFrontmatter: true },
  });
  return { content, frontmatter };
}
```

---

## Pattern 3: Custom Remark Plugin

### Admonition Syntax Extension

```typescript
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Blockquote, Paragraph, Text } from "mdast";

const remarkAdmonitions: Plugin = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0] as Paragraph | undefined;
      if (!firstChild || firstChild.type !== "paragraph") return;

      const textNode = firstChild.children[0] as Text | undefined;
      if (!textNode || textNode.type !== "text") return;

      const match = textNode.value.match(/^\[!(NOTE|WARNING|TIP|CAUTION)\]/);
      if (!match) return;

      const type = match[1].toLowerCase();
      textNode.value = textNode.value.replace(/^\[!(NOTE|WARNING|TIP|CAUTION)\]\s*/, "");

      // Add data attributes for styling
      (node.data as Record<string, unknown>) = {
        hProperties: { className: `admonition admonition-${type}` },
      };
    });
  };
};
```

**Usage**: `> [!WARNING] This action is irreversible.` renders as a styled warning callout.

---

## Pattern 4: Python Markdown Processing

### Backend Content Rendering

```python
import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.tables import TableExtension
import bleach


ALLOWED_TAGS = [
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "a", "code", "pre", "em", "strong",
    "blockquote", "table", "thead", "tbody", "tr", "th", "td",
]

ALLOWED_ATTRS = {"a": ["href", "title"], "code": ["class"]}


def render_markdown_safe(content: str) -> str:
    """Render Markdown to sanitised HTML."""
    html = markdown.markdown(
        content,
        extensions=[
            FencedCodeExtension(),
            CodeHiliteExtension(css_class="highlight"),
            TableExtension(),
            "md_in_html",
        ],
    )
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)
```

**Use case**: Rendering agent output or document content stored in the database before returning in API responses.

---

## Pattern 5: Markdown Component (React)

### Reusable Renderer with Scientific Luxury Styling

```tsx
import { memo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none
        prose-headings:font-mono prose-headings:text-white/90
        prose-p:text-white/70 prose-a:text-[#00F5FF]
        prose-code:rounded-sm prose-code:bg-white/[0.05]
        prose-code:px-1.5 prose-code:py-0.5
        prose-pre:rounded-sm prose-pre:border-[0.5px]
        prose-pre:border-white/[0.06] prose-pre:bg-white/[0.02]
        ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
});
```

**Rule**: Always use `dangerouslySetInnerHTML` only with sanitised HTML from the server pipeline. Never pass raw user input.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Regex-based Markdown parsing | Breaks on nested elements, edge cases | unified/remark pipeline |
| Client-side rendering | Large bundle, slow initial render | Server-side with RSC |
| No sanitisation | XSS via Markdown links and images | `rehype-sanitize` or `bleach` |
| Inline styles in rendered HTML | Inconsistent with design system | Tailwind prose classes |
| Re-parsing on every render | Wasted computation | `memo()` + cache rendered HTML |

---

## Checklist

Before merging markdown-processor changes:

- [ ] unified pipeline with remark-parse, remark-gfm, rehype-sanitize
- [ ] Syntax highlighting with Shiki or rehype-highlight
- [ ] MDX support for interactive content pages
- [ ] Custom remark plugin for admonitions
- [ ] Python-side rendering with bleach sanitisation
- [ ] `MarkdownRenderer` component with Scientific Luxury prose styles
- [ ] Server-side rendering by default

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Markdown Processor Implementation

**Pipeline**: [unified/remark / python-markdown / both]
**Sanitisation**: [rehype-sanitize / bleach / both]
**Syntax Highlighting**: [Shiki / rehype-highlight / none]
**MDX Support**: [enabled / disabled]
**Custom Plugins**: [admonitions / callouts / none]
**Rendering**: [server-side RSC / API route / client-side]
```
