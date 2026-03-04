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
import { useState } from 'react';
import '@/styles/novel-dark.css';

const defaultContent: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const slashCommandItems = createSuggestionItems([
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
