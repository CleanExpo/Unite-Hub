/**
 * Obsidian Note Templates
 *
 * Generates .md content for contact, business, and daily notes.
 * All templates use YAML frontmatter + structured markdown body.
 */

import { stringifyNote, NoteFrontmatter } from './markdown';

// ─── Contact template ────────────────────────────────────────────────────────

export interface ContactTemplateData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  business?: string | null;
  status?: string | null;
  tags?: string[];
  lastInteraction?: string | null;
}

export function generateContactNote(data: ContactTemplateData, baseUrl: string): string {
  const frontmatter: NoteFrontmatter = {
    type: 'contact',
    crm_id: data.id,
    name: data.name,
    email: data.email ?? '',
    business: data.business ?? data.company ?? '',
    phone: data.phone ?? '',
    last_interaction: data.lastInteraction ?? new Date().toISOString().split('T')[0],
    tags: data.tags ?? [],
    crm_link: `${baseUrl}/contacts/${data.id}`,
  };

  const body = `# ${data.name}

## Notes


## Action Items
- [ ]

## Interaction History
`;

  return stringifyNote(frontmatter, body);
}

// ─── Business template ───────────────────────────────────────────────────────

export interface BusinessTemplateData {
  key: string;
  name: string;
  industry?: string;
  abn?: string;
}

export function generateBusinessNote(data: BusinessTemplateData): string {
  const frontmatter: NoteFrontmatter = {
    type: 'business',
    name: data.name,
    business_key: data.key,
    industry: data.industry ?? '',
    abn: data.abn ?? '',
    tags: ['business'],
  };

  const body = `# ${data.name}

## Overview


## Key Contacts


## Active Projects


## Notes
`;

  return stringifyNote(frontmatter, body);
}

// ─── Daily note template ─────────────────────────────────────────────────────

export function generateDailyNote(date: Date): string {
  const iso = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const display = date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const frontmatter: NoteFrontmatter = {
    type: 'daily-note',
    date: iso,
    tags: ['daily-note'],
  };

  const body = `# ${display}

## Captures


## Tasks Created
- [ ]

## Events Today
`;

  return stringifyNote(frontmatter, body);
}

// ─── Obsidian config files ────────────────────────────────────────────────────

export const OBSIDIAN_APP_JSON = JSON.stringify({
  promptDelete: false,
  alwaysUpdateLinks: true,
  newFileLocation: 'root',
  newFileFolderPath: '',
  attachmentFolderPath: 'Attachments',
  useMarkdownLinks: false,
  showLineNumber: false,
  readableLineLength: true,
  defaultViewMode: 'preview',
}, null, 2);

export const OBSIDIAN_GRAPH_JSON = JSON.stringify({
  collapse: false,
  colorGroups: [
    { query: 'tag:#contact', color: { a: 1, rgb: 15 } },       // #00F5FF cyan
    { query: 'tag:#business', color: { a: 1, rgb: 65408 } },   // #00FF88 emerald
    { query: 'tag:#daily-note', color: { a: 1, rgb: 16745472 } }, // #FFB800 amber
  ],
  forces: {
    repelStrength: 15,
    linkStrength: 1,
    linkDistance: 250,
    centerStrength: 0.518713,
  },
  display: {
    showTags: true,
    showAttachments: false,
    hideUnresolved: false,
    showOrphans: true,
    nodeSize: 4,
    lineSizeMultiplier: 1,
    textFadeMultiplier: 0,
    fadeIntensity: 1,
  },
}, null, 2);

export const OBSIDIAN_WORKSPACE_JSON = JSON.stringify({
  main: {
    id: 'main',
    type: 'split',
    children: [
      {
        id: 'left',
        type: 'leaf',
        state: {
          type: 'empty',
          state: {},
        },
      },
    ],
  },
  ribbon: {},
  statusBar: {},
  leftSidebar: { open: true },
  rightSidebar: { open: false },
  active: 'left',
  lastOpenFiles: [],
}, null, 2);
