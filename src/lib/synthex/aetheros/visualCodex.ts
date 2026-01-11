/**
 * AetherOS Omega Protocol - Visual Codex (The Semantic Memory)
 * 
 * Translates generic user prompts into precise visual orchestrator language.
 * Uses the codex database to transform "make it shiny" into professional terminology.
 */

import visualCodexData from './visualCodex.json';
import type { CodexEntry, VisualCodex } from './types';

// ============================================================================
// CODEX LOADING
// ============================================================================

const CODEX: VisualCodex = visualCodexData as VisualCodex;

/**
 * Get all codex entries
 */
export function getCodex(): VisualCodex {
  return CODEX;
}

/**
 * Get entries by category
 */
export function getEntriesByCategory(
  category: CodexEntry['category']
): CodexEntry[] {
  return CODEX.entries.filter((entry) => entry.category === category);
}

/**
 * Get entries by priority
 */
export function getEntriesByPriority(
  priority: CodexEntry['priority']
): CodexEntry[] {
  return CODEX.entries.filter((entry) => entry.priority === priority);
}

// ============================================================================
// PROMPT TRANSLATION
// ============================================================================

/**
 * Translate a generic prompt into orchestrator language
 * Returns enhanced prompt with professional visual terminology
 */
export function translatePrompt(genericPrompt: string): string {
  let enhancedPrompt = genericPrompt;
  const matches: Array<{ entry: CodexEntry; index: number }> = [];

  // Find all matching codex entries in the prompt
  for (const entry of CODEX.entries) {
    const regex = new RegExp(entry.generic_prompt, 'gi');
    const match = regex.exec(genericPrompt.toLowerCase());
    
    if (match) {
      matches.push({
        entry,
        index: match.index,
      });
    }
  }

  // Sort by priority (high first) and position
  matches.sort((a, b) => {
    if (a.entry.priority !== b.entry.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.entry.priority] - priorityOrder[b.entry.priority];
    }
    return a.index - b.index;
  });

  // Replace generic terms with orchestrator language
  for (const { entry } of matches) {
    const regex = new RegExp(entry.generic_prompt, 'gi');
    enhancedPrompt = enhancedPrompt.replace(
      regex,
      entry.orchestrator_prompt
    );
  }

  return enhancedPrompt;
}

/**
 * Get translation suggestions for a prompt
 * Returns array of possible enhancements without modifying the original
 */
export function getSuggestions(prompt: string): CodexEntry[] {
  const suggestions: CodexEntry[] = [];

  for (const entry of CODEX.entries) {
    const regex = new RegExp(entry.generic_prompt, 'i');
    if (regex.test(prompt.toLowerCase())) {
      suggestions.push(entry);
    }
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Build a 14-slot context assembler prompt
 * Follows AetherOS protocol for structured visual generation
 */
export function buildContextAssembler(params: {
  subject: string;
  style?: string;
  lighting?: string;
  camera?: string;
  composition?: string;
  texture?: string;
  color?: string;
  mood?: string;
  environment?: string;
  effects?: string;
  quality?: string;
  technical?: string;
  constraints?: string;
  references?: string;
}): string {
  const slots: string[] = [];

  // Slot 1: Subject (required)
  slots.push(`Subject: ${translatePrompt(params.subject)}`);

  // Slot 2: Style
  if (params.style) {
    slots.push(`Style: ${translatePrompt(params.style)}`);
  }

  // Slot 3: Lighting
  if (params.lighting) {
    slots.push(`Lighting: ${translatePrompt(params.lighting)}`);
  }

  // Slot 4: Camera
  if (params.camera) {
    slots.push(`Camera: ${translatePrompt(params.camera)}`);
  }

  // Slot 5: Composition
  if (params.composition) {
    slots.push(`Composition: ${translatePrompt(params.composition)}`);
  }

  // Slot 6: Texture/Material
  if (params.texture) {
    slots.push(`Material: ${translatePrompt(params.texture)}`);
  }

  // Slot 7: Color
  if (params.color) {
    slots.push(`Color: ${params.color}`);
  }

  // Slot 8: Mood/Atmosphere
  if (params.mood) {
    slots.push(`Mood: ${params.mood}`);
  }

  // Slot 9: Environment
  if (params.environment) {
    slots.push(`Environment: ${params.environment}`);
  }

  // Slot 10: Effects
  if (params.effects) {
    slots.push(`Effects: ${params.effects}`);
  }

  // Slot 11: Quality directives
  if (params.quality) {
    slots.push(`Quality: ${params.quality}`);
  } else {
    slots.push('Quality: 8K resolution, photorealistic, ultra-detailed');
  }

  // Slot 12: Technical specs
  if (params.technical) {
    slots.push(`Technical: ${params.technical}`);
  }

  // Slot 13: Constraints (what to avoid)
  if (params.constraints) {
    slots.push(`Avoid: ${params.constraints}`);
  }

  // Slot 14: Style references
  if (params.references) {
    slots.push(`References: ${params.references}`);
  }

  return slots.join(' | ');
}

/**
 * Quick translate with auto-detection
 * Analyzes prompt and applies appropriate codex entries
 */
export function quickTranslate(prompt: string): {
  original: string;
  translated: string;
  entriesApplied: CodexEntry[];
} {
  const suggestions = getSuggestions(prompt);
  const translated = translatePrompt(prompt);

  return {
    original: prompt,
    translated,
    entriesApplied: suggestions,
  };
}

/**
 * Add custom codex entry (runtime extension)
 * Allows users to teach the Orchestrator new translations
 */
const customEntries: CodexEntry[] = [];

export function addCustomEntry(entry: Omit<CodexEntry, 'priority'>): void {
  const fullEntry: CodexEntry = {
    ...entry,
    priority: 'medium',
  };
  customEntries.push(fullEntry);
}

/**
 * Get all entries including custom ones
 */
export function getAllEntries(): CodexEntry[] {
  return [...CODEX.entries, ...customEntries];
}

/**
 * Search codex by keyword
 */
export function searchCodex(keyword: string): CodexEntry[] {
  const allEntries = getAllEntries();
  const lowerKeyword = keyword.toLowerCase();

  return allEntries.filter(
    (entry) =>
      entry.concept.toLowerCase().includes(lowerKeyword) ||
      entry.generic_prompt.toLowerCase().includes(lowerKeyword) ||
      entry.orchestrator_prompt.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Get random entry for inspiration
 */
export function getRandomEntry(): CodexEntry {
  const allEntries = getAllEntries();
  return allEntries[Math.floor(Math.random() * allEntries.length)];
}

/**
 * Validate prompt complexity
 * Returns score 0-100 indicating how well-defined the prompt is
 */
export function validatePromptComplexity(prompt: string): {
  score: number;
  suggestions: string[];
  missingElements: string[];
} {
  const suggestions: string[] = [];
  const missingElements: string[] = [];
  let score = 0;

  // Check for codex matches (each match adds points)
  const matches = getSuggestions(prompt);
  score += matches.length * 10;

  // Check for key elements
  const hasSubject = prompt.length > 10;
  const hasStyle = /style|aesthetic|vibe|look/i.test(prompt);
  const hasLighting = /light|bright|dark|shadow|glow/i.test(prompt);
  const hasCamera = /camera|shot|angle|view|perspective/i.test(prompt);
  const hasColor = /color|colou?red?|palette|hue/i.test(prompt);
  const hasTexture = /texture|material|surface|finish/i.test(prompt);

  if (!hasSubject) {
    missingElements.push('Clear subject definition');
  } else {
    score += 20;
  }

  if (!hasStyle) {
    missingElements.push('Visual style or aesthetic');
    suggestions.push('Add style keywords like "modern" or "professional"');
  } else {
    score += 15;
  }

  if (!hasLighting) {
    missingElements.push('Lighting description');
    suggestions.push('Specify lighting like "dramatic" or "soft lighting"');
  } else {
    score += 15;
  }

  if (!hasCamera) {
    missingElements.push('Camera perspective');
    suggestions.push('Add camera angle like "close up" or "wide shot"');
  } else {
    score += 10;
  }

  if (!hasColor) {
    missingElements.push('Color specification');
  } else {
    score += 5;
  }

  if (!hasTexture) {
    missingElements.push('Texture/material detail');
  } else {
    score += 5;
  }

  return {
    score: Math.min(100, score),
    suggestions,
    missingElements,
  };
}
