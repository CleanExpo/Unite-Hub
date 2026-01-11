/**
 * FAQPage Automation
 * Automatically generates structured FAQ pages from client contributions
 * Extracts Q&A patterns and generates schema.org FAQPage markup
 */

import { ClientContribution } from '@/lib/services/client-contribution';
import { AuthorProfile } from './author-attribution';

export interface QAExtraction {
  question: string;
  answer: string;
  category: string;
  answerAuthor: {
    name: string;
    title: string;
    expertise: string[];
  };
  confidence: number; // 0-100
}

export interface FAQPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: FAQEntry[];
}

export interface FAQEntry {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
    author?: AuthorProfile;
  };
}

/**
 * Extract Q&A from contribution text
 */
export function extractQAFromContribution(contribution: ClientContribution): QAExtraction[] {
  const text = contribution.content_text || '';
  if (!text) return [];

  const qaList: QAExtraction[] = [];

  // Pattern 1: Q: ... A: ...
  const qaPattern = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs;
  let match;
  while ((match = qaPattern.exec(text)) !== null) {
    qaList.push({
      question: match[1].trim(),
      answer: match[2].trim(),
      category: detectCategory(match[1]),
      answerAuthor: {
        name: 'Service Provider',
        title: 'Expert',
        expertise: [],
      },
      confidence: 0.9,
    });
  }

  // Pattern 2: Question mark sentences
  const questionPattern = /(.+\?)/g;
  const questions = text.match(questionPattern) || [];
  questions.forEach((q) => {
    const answer = extractAnswerForQuestion(text, q);
    if (answer && answer.length > 20) {
      qaList.push({
        question: q.trim(),
        answer: answer.trim(),
        category: detectCategory(q),
        answerAuthor: {
          name: 'Service Provider',
          title: 'Expert',
          expertise: [],
        },
        confidence: 0.7,
      });
    }
  });

  return qaList;
}

/**
 * Generate FAQPage schema from Q&A list
 */
export function generateFAQPageSchema(
  qaList: QAExtraction[],
  businessName: string,
  businessUrl: string
): FAQPage {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qaList
      .filter((qa) => qa.confidence > 0.6) // Only high-confidence QA
      .map((qa) => ({
        '@type': 'Question',
        name: qa.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: qa.answer,
          author: {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: qa.answerAuthor.name,
            jobTitle: qa.answerAuthor.title,
            affiliation: {
              '@type': 'Organization',
              name: businessName,
              url: businessUrl,
            },
            knowsAbout: qa.answerAuthor.expertise,
          },
        },
      })),
  };
}

/**
 * Generate HTML FAQPage with markup
 */
export function generateFAQPageHTML(
  qaList: QAExtraction[],
  businessName: string,
  pageTitle: string
): string {
  const htmlParts: string[] = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    `<title>${pageTitle}</title>`,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<script type="application/ld+json">`,
    JSON.stringify(
      generateFAQPageSchema(qaList, businessName, 'https://example.com'),
      null,
      2
    ),
    '</script>',
    '</head>',
    '<body>',
    `<h1>${pageTitle}</h1>`,
    `<p>Frequently asked questions about ${businessName} services.</p>`,
    '<section class="faq-list">',
  ];

  qaList.forEach((qa, idx) => {
    htmlParts.push(`
      <article class="faq-item" itemscope itemtype="https://schema.org/Question">
        <h2 itemprop="name">${escapeHtml(qa.question)}</h2>
        <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
          <div itemprop="text" class="answer">
            ${formatAnswerText(qa.answer)}
          </div>
          <footer class="answer-by">
            <small>Answered by <strong>${escapeHtml(qa.answerAuthor.name)}</strong>, ${escapeHtml(qa.answerAuthor.title)}</small>
          </footer>
        </div>
      </article>
    `);
  });

  htmlParts.push('</section>', '</body>', '</html>');

  return htmlParts.join('\n');
}

/**
 * Detect question category
 */
function detectCategory(text: string): string {
  const textLower = text.toLowerCase();

  if (textLower.match(/how|what|why|when|where/)) return 'How To';
  if (textLower.match(/price|cost|fee|afford|pay/)) return 'Pricing';
  if (textLower.match(/time|duration|long|hour|day/)) return 'Timeline';
  if (textLower.match(/quality|good|best|guarantee|warranty/)) return 'Quality';
  if (textLower.match(/location|service area|travel|distance/)) return 'Service Area';
  if (textLower.match(/license|certif|insurance|bonded/)) return 'Credentials';
  if (textLower.match(/experience|year|background|training/)) return 'Experience';
  if (textLower.match(/reference|previous|client|review/)) return 'References';

  return 'General';
}

/**
 * Extract answer for a question from text
 */
function extractAnswerForQuestion(text: string, question: string): string {
  // Find the question position
  const qIndex = text.indexOf(question);
  if (qIndex === -1) return '';

  // Get text after question until next sentence end
  const afterQuestion = text.substring(qIndex + question.length);

  // Find next sentence (ends with . ! or ?)
  const sentenceMatch = afterQuestion.match(/([^.!?]*[.!?]){1,3}/);
  if (!sentenceMatch) return '';

  return sentenceMatch[0].trim();
}

/**
 * Format answer text with paragraphs
 */
function formatAnswerText(text: string): string {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+|(?<=[.!?])\s+(?=[A-Z])/);

  return paragraphs
    .map((p) => {
      if (!p.trim()) return '';
      return `<p>${escapeHtml(p.trim())}</p>`;
    })
    .join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate FAQ from multiple contributions
 */
export function generateFAQFromContributions(
  contributions: ClientContribution[],
  businessName: string,
  businessUrl: string
): FAQPage {
  const allQA: QAExtraction[] = [];

  contributions.forEach((contrib) => {
    const qaList = extractQAFromContribution(contrib);
    allQA.push(...qaList);
  });

  // Deduplicate and sort by confidence
  const uniqueQA = deduplicateQA(allQA).sort((a, b) => b.confidence - a.confidence);

  return generateFAQPageSchema(uniqueQA, businessName, businessUrl);
}

/**
 * Deduplicate Q&A entries
 */
function deduplicateQA(qaList: QAExtraction[]): QAExtraction[] {
  const seen = new Set<string>();
  return qaList.filter((qa) => {
    const key = normalizeQuestion(qa.question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Normalize question for comparison
 */
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Merge multiple FAQPages
 */
export function mergeFAQPages(pages: FAQPage[]): FAQPage {
  const allEntries = pages.flatMap((page) => page.mainEntity);

  // Deduplicate by question name
  const seen = new Set<string>();
  const uniqueEntries = allEntries.filter((entry) => {
    if (seen.has(entry.name)) return false;
    seen.add(entry.name);
    return true;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: uniqueEntries,
  };
}
