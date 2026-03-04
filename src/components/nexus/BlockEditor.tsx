'use client';

import {
  EditorRoot,
  EditorContent,
  type EditorContentProps,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  type JSONContent,
  handleCommandNavigation,
  createSuggestionItems,
  renderItems,
} from 'novel';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/novel-dark.css';

const defaultContent: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

async function callAiGenerate(
  prompt: string,
  mode: 'write' | 'summarise' | 'improve',
  context?: string,
): Promise<string> {
  const res = await fetch('/api/nexus/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'AI generation failed');
  }
  const data = await res.json();
  return data.text;
}

const slashCommandItems = createSuggestionItems([
  {
    title: 'AI Write',
    description: 'Continue writing with AI',
    icon: <span className="text-sm text-[#00F5FF]">AI</span>,
    searchTerms: ['ai', 'write', 'generate', 'continue'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();

      const cursorPos = editor.state.selection.from;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, cursorPos - 500),
        cursorPos,
        ' ',
      );

      const prompt = textBefore.trim() || 'Write an opening paragraph for a business document.';

      editor.setEditable(false);
      const loadingId = `ai-loading-${Date.now()}`;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'paragraph',
          attrs: { id: loadingId },
          content: [{ type: 'text', text: 'Generating...' }],
        })
        .run();

      callAiGenerate(prompt, 'write')
        .then((text) => {
          editor.setEditable(true);
          const { doc } = editor.state;
          let loadingPos = -1;
          doc.descendants((node, pos) => {
            if (
              node.type.name === 'paragraph' &&
              node.textContent === 'Generating...' &&
              loadingPos === -1
            ) {
              loadingPos = pos;
            }
          });
          if (loadingPos >= 0) {
            const nodeAtPos = doc.nodeAt(loadingPos);
            if (nodeAtPos) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: loadingPos, to: loadingPos + nodeAtPos.nodeSize })
                .insertContentAt(loadingPos, {
                  type: 'paragraph',
                  content: [{ type: 'text', text }],
                })
                .run();
            }
          }
        })
        .catch(() => {
          editor.setEditable(true);
          const { doc } = editor.state;
          let loadingPos = -1;
          doc.descendants((node, pos) => {
            if (
              node.type.name === 'paragraph' &&
              node.textContent === 'Generating...' &&
              loadingPos === -1
            ) {
              loadingPos = pos;
            }
          });
          if (loadingPos >= 0) {
            const nodeAtPos = doc.nodeAt(loadingPos);
            if (nodeAtPos) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: loadingPos, to: loadingPos + nodeAtPos.nodeSize })
                .run();
            }
          }
        });
    },
  },
  {
    title: 'AI Summarise',
    description: 'Summarise this block',
    icon: <span className="text-sm text-[#00F5FF]">S</span>,
    searchTerms: ['ai', 'summarise', 'summarize', 'summary', 'tldr'],
    command: ({ editor, range }) => {
      const { from, to } = editor.state.selection;
      const selectedText =
        from !== to
          ? editor.state.doc.textBetween(from, to, ' ')
          : editor.state.doc.textContent;
      const context = selectedText.slice(0, 2000);

      editor.chain().focus().deleteRange(range).run();
      editor.setEditable(false);
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'paragraph',
          content: [{ type: 'text', text: 'Summarising...' }],
        })
        .run();

      callAiGenerate('Summarise the following text.', 'summarise', context)
        .then((text) => {
          editor.setEditable(true);
          const { doc } = editor.state;
          let loadingPos = -1;
          doc.descendants((node, pos) => {
            if (
              node.type.name === 'paragraph' &&
              node.textContent === 'Summarising...' &&
              loadingPos === -1
            ) {
              loadingPos = pos;
            }
          });
          if (loadingPos >= 0) {
            const nodeAtPos = doc.nodeAt(loadingPos);
            if (nodeAtPos) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: loadingPos, to: loadingPos + nodeAtPos.nodeSize })
                .insertContentAt(loadingPos, {
                  type: 'paragraph',
                  content: [{ type: 'text', text }],
                })
                .run();
            }
          }
        })
        .catch(() => {
          editor.setEditable(true);
          const { doc } = editor.state;
          let loadingPos = -1;
          doc.descendants((node, pos) => {
            if (
              node.type.name === 'paragraph' &&
              node.textContent === 'Summarising...' &&
              loadingPos === -1
            ) {
              loadingPos = pos;
            }
          });
          if (loadingPos >= 0) {
            const nodeAtPos = doc.nodeAt(loadingPos);
            if (nodeAtPos) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: loadingPos, to: loadingPos + nodeAtPos.nodeSize })
                .run();
            }
          }
        });
    },
  },
  {
    title: 'AI Improve',
    description: 'Improve writing',
    icon: <span className="text-sm text-[#00F5FF]">+</span>,
    searchTerms: ['ai', 'improve', 'rewrite', 'better', 'enhance'],
    command: ({ editor, range }) => {
      const { from, to } = editor.state.selection;
      const selectedText =
        from !== to
          ? editor.state.doc.textBetween(from, to, ' ')
          : editor.state.doc.textContent;
      const context = selectedText.slice(0, 2000);

      editor.chain().focus().deleteRange(range).run();
      editor.setEditable(false);
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'paragraph',
          content: [{ type: 'text', text: 'Improving...' }],
        })
        .run();

      callAiGenerate('Improve the following text.', 'improve', context)
        .then((text) => {
          editor.setEditable(true);
          const { doc } = editor.state;
          let loadingPos = -1;
          doc.descendants((node, pos) => {
            if (
              node.type.name === 'paragraph' &&
              node.textContent === 'Improving...' &&
              loadingPos === -1
            ) {
              loadingPos = pos;
            }
          });
          if (loadingPos >= 0) {
            const nodeAtPos = doc.nodeAt(loadingPos);
            if (nodeAtPos) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: loadingPos, to: loadingPos + nodeAtPos.nodeSize })
                .insertContentAt(loadingPos, {
                  type: 'paragraph',
                  content: [{ type: 'text', text }],
                })
                .run();
            }
          }
        })
        .catch(() => {
          editor.setEditable(true);
          const { doc } = editor.state;
          let loadingPos = -1;
          doc.descendants((node, pos) => {
            if (
              node.type.name === 'paragraph' &&
              node.textContent === 'Improving...' &&
              loadingPos === -1
            ) {
              loadingPos = pos;
            }
          });
          if (loadingPos >= 0) {
            const nodeAtPos = doc.nodeAt(loadingPos);
            if (nodeAtPos) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: loadingPos, to: loadingPos + nodeAtPos.nodeSize })
                .run();
            }
          }
        });
    },
  },
  {
    title: 'Diagram',
    description: 'Insert Excalidraw diagram',
    icon: <span className="text-sm text-[#00F5FF]">&#9998;</span>,
    searchTerms: ['diagram', 'draw', 'excalidraw', 'sketch', 'whiteboard'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Insert a linked diagram block — opens the standalone diagram page
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: '/founder/diagram', target: '_blank' } }],
              text: '📐 Open Diagram Editor',
            },
          ],
        })
        .run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <span className="text-sm font-bold">H1</span>,
    searchTerms: ['h1', 'title', 'heading'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <span className="text-sm font-bold">H2</span>,
    searchTerms: ['h2', 'subtitle'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <span className="text-sm font-bold">H3</span>,
    searchTerms: ['h3'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: <span className="text-sm">-</span>,
    searchTerms: ['bullet', 'unordered', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    icon: <span className="text-sm">1.</span>,
    searchTerms: ['numbered', 'ordered', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Checklist with to-do items',
    icon: <span className="text-sm">☐</span>,
    searchTerms: ['task', 'todo', 'check'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Blockquote',
    description: 'Quote block',
    icon: <span className="text-sm">&ldquo;</span>,
    searchTerms: ['quote', 'blockquote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Fenced code block',
    icon: <span className="text-sm font-mono">{'{}'}</span>,
    searchTerms: ['code', 'codeblock', 'fenced'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: <span className="text-sm">---</span>,
    searchTerms: ['divider', 'hr', 'rule'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
]);

interface BlockEditorProps {
  initialContent?: JSONContent;
  onUpdate?: (json: JSONContent) => void;
  placeholder?: string;
  className?: string;
}

export function BlockEditor({ initialContent, onUpdate, placeholder, className }: BlockEditorProps) {
  const [, setContent] = useState<JSONContent>(initialContent ?? defaultContent);

  return (
    <div className={`novel-editor ${className ?? ''}`}>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent ?? defaultContent}
          extensions={[]}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            setContent(json);
            onUpdate?.(json);
          }}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
              class: 'prose prose-invert max-w-none focus:outline-none',
              ...(placeholder ? { 'data-placeholder': placeholder } : {}),
            },
          }}
          slotAfter={
            <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-sm border border-[#222] bg-[#111] px-1 py-2 shadow-md">
              <EditorCommandEmpty className="px-2 text-[#555]">No results</EditorCommandEmpty>
              <EditorCommandList>
                {slashCommandItems.map((item) => (
                  <EditorCommandItem
                    key={item.title}
                    value={item.title}
                    onCommand={(val) => item.command?.(val)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm text-[#e5e5e5] hover:bg-[#1a1a1a] hover:text-[#00F5FF] aria-selected:bg-[#1a1a1a] aria-selected:text-[#00F5FF]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#222] bg-[#0d0d0d]">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-[#666]">{item.description}</p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>
          }
        >
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
