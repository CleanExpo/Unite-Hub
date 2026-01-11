/**
 * VideoObject Schema Generator
 * Generates schema.org VideoObject with transcripts, duration, thumbnails
 * Optimized for Google Video Search, YouTube, and LLM platforms
 */

import { ClientMedia } from './multi-platform-generator';

export interface VideoMetadata {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds
  transcript: string;
  uploadDate: string;
  name: string;
  description: string;
  contentLocation?: {
    name: string;
    addressCountry?: string;
  };
}

export interface VideoObjectSchema {
  '@context': 'https://schema.org';
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  uploadDate: string;
  duration: string; // ISO 8601 format: PT2M30S
  contentUrl: string;
  embedUrl?: string;
  transcript?: string;
  author?: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
  potentialAction?: {
    '@type': 'WatchAction';
    target: string;
  };
  keywords?: string[];
  contentLocation?: {
    '@type': 'Place';
    name: string;
  };
  interactionStatistic?: Array<{
    '@type': 'InteractionCounter';
    interactionType: string;
    userInteractionCount: number;
  }>;
}

/**
 * Convert seconds to ISO 8601 duration format
 * Example: 150 seconds -> PT2M30S
 */
export function secondsToISO8601Duration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (secs > 0) duration += `${secs}S`;

  return duration === 'PT' ? 'PT0S' : duration;
}

/**
 * Extract video duration from media file
 */
export function extractDurationFromMetadata(
  metadata?: Record<string, any>
): number {
  if (!metadata) return 120; // Default 2 minutes

  // Try common metadata field names
  const durationSeconds =
    metadata.duration_seconds ||
    metadata.duration ||
    metadata.durationSeconds ||
    metadata.videoDuration;

  if (durationSeconds && typeof durationSeconds === 'number') {
    return Math.max(1, durationSeconds);
  }

  return 120; // Default fallback
}

/**
 * Generate VideoObject schema with transcript
 */
export function generateVideoObjectSchema(
  metadata: VideoMetadata,
  additionalData?: {
    viewCount?: number;
    commentCount?: number;
    ratingValue?: number;
  }
): VideoObjectSchema {
  const durationISO = secondsToISO8601Duration(metadata.duration);

  const schema: VideoObjectSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: metadata.name,
    description: metadata.description,
    thumbnailUrl: metadata.thumbnailUrl,
    uploadDate: metadata.uploadDate,
    duration: durationISO,
    contentUrl: metadata.videoUrl,
  };

  // Add optional fields
  if (metadata.transcript) {
    schema.transcript = metadata.transcript;
  }

  if (metadata.contentLocation) {
    schema.contentLocation = {
      '@type': 'Place',
      name: metadata.contentLocation.name,
    };
  }

  if (additionalData?.viewCount !== undefined) {
    schema.interactionStatistic = [
      {
        '@type': 'InteractionCounter',
        interactionType: 'WatchAction',
        userInteractionCount: additionalData.viewCount,
      },
    ];

    if (additionalData.commentCount !== undefined) {
      schema.interactionStatistic.push({
        '@type': 'InteractionCounter',
        interactionType: 'CommentAction',
        userInteractionCount: additionalData.commentCount,
      });
    }
  }

  return schema;
}

/**
 * Generate BreadcrumbList for video page navigation
 * Helps search engines understand video location in site hierarchy
 */
export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateVideoBreadcrumbSchema(
  videoPageUrl: string,
  videoTitle: string,
  breadcrumbs: Array<{ name: string; url: string }>
): BreadcrumbListSchema {
  const items = [
    { name: 'Home', url: new URL(videoPageUrl).origin },
    ...breadcrumbs,
    { name: videoTitle, url: videoPageUrl },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate ClipObject schema for video segments
 * Useful for highlighting specific moments in testimonial videos
 */
export interface VideoClipSchema {
  '@context': 'https://schema.org';
  '@type': 'Clip';
  name: string;
  description: string;
  url: string;
  startOffset: number; // seconds
  endOffset: number; // seconds
  partOf: {
    '@type': 'VideoObject';
    url: string;
  };
}

export function generateVideoClipSchema(
  clipName: string,
  clipDescription: string,
  clipPageUrl: string,
  startSeconds: number,
  endSeconds: number,
  fullVideoUrl: string
): VideoClipSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Clip',
    name: clipName,
    description: clipDescription,
    url: clipPageUrl,
    startOffset: startSeconds,
    endOffset: endSeconds,
    partOf: {
      '@type': 'VideoObject',
      url: fullVideoUrl,
    },
  };
}

/**
 * Generate VideoObject optimized for each LLM platform
 * Platform-specific formatting (JSON-LD, Markdown, etc.)
 */
export function generateVideoObjectForPlatform(
  platform: 'google' | 'chatgpt' | 'perplexity' | 'bing' | 'claude' | 'gemini',
  metadata: VideoMetadata,
  additionalData?: {
    viewCount?: number;
    commentCount?: number;
  }
): string {
  const baseSchema = generateVideoObjectSchema(metadata, additionalData);

  switch (platform) {
    case 'google': {
      // Google: Standard JSON-LD
      return JSON.stringify(baseSchema, null, 2);
    }

    case 'chatgpt': {
      // ChatGPT: Markdown with structured table
      return `
## Video: ${metadata.name}

| Property | Value |
|----------|-------|
| **Duration** | ${metadata.duration} seconds |
| **Uploaded** | ${new Date(metadata.uploadDate).toLocaleDateString()} |
| **Location** | ${metadata.contentLocation?.name || 'Not specified'} |
| **Views** | ${additionalData?.viewCount || 'Unknown'} |

### Description
${metadata.description}

### Transcript
\`\`\`
${metadata.transcript || 'No transcript available'}
\`\`\`

**Watch**: [View Video](${metadata.videoUrl})
`.trim();
    }

    case 'perplexity': {
      // Perplexity: Citation format
      return `
**Video**: ${metadata.name}

${metadata.description}

**Duration**: ${metadata.duration} seconds
**Uploaded**: ${new Date(metadata.uploadDate).toLocaleDateString()}
**Transcript**:
"${metadata.transcript || 'No transcript available'}"

**Source**: ${metadata.videoUrl}
**Confidence**: High (verified video content)
`.trim();
    }

    case 'bing': {
      // Bing: Microdata HTML
      return `
<div itemscope itemtype="https://schema.org/VideoObject">
  <h1 itemprop="name">${escapeHtml(metadata.name)}</h1>
  <p itemprop="description">${escapeHtml(metadata.description)}</p>

  <img itemprop="thumbnailUrl" src="${metadata.thumbnailUrl}" alt="${escapeHtml(metadata.name)}">

  <meta itemprop="uploadDate" content="${metadata.uploadDate}">
  <meta itemprop="duration" content="${secondsToISO8601Duration(metadata.duration)}">
  <meta itemprop="contentUrl" content="${metadata.videoUrl}">

  <div itemprop="transcript">${escapeHtml(metadata.transcript || '')}</div>

  <a itemprop="url" href="${metadata.videoUrl}">Watch Video</a>
</div>
`.trim();
    }

    case 'claude': {
      // Claude: Semantic HTML5
      return `
<article class="video-content">
  <header>
    <h1>${metadata.name}</h1>
    <time datetime="${metadata.uploadDate}">
      ${new Date(metadata.uploadDate).toLocaleDateString()}
    </time>
  </header>

  <figure>
    <img src="${metadata.thumbnailUrl}" alt="${metadata.name}">
    <figcaption>Video Duration: ${metadata.duration}s</figcaption>
  </figure>

  <section class="description">
    <p>${metadata.description}</p>
  </section>

  <section class="transcript">
    <h2>Transcript</h2>
    <blockquote>${metadata.transcript || 'No transcript available'}</blockquote>
  </section>

  <footer>
    <a href="${metadata.videoUrl}">View Full Video</a>
  </footer>
</article>
`.trim();
    }

    case 'gemini': {
      // Gemini: RDFa
      return `
<div vocab="https://schema.org/" typeof="VideoObject">
  <h1 property="name">${metadata.name}</h1>

  <img property="thumbnailUrl" src="${metadata.thumbnailUrl}" alt="${metadata.name}">

  <p property="description">${metadata.description}</p>

  <span property="uploadDate" content="${metadata.uploadDate}">
    Published: ${new Date(metadata.uploadDate).toLocaleDateString()}
  </span>

  <meta property="duration" content="${secondsToISO8601Duration(metadata.duration)}">
  <meta property="contentUrl" content="${metadata.videoUrl}">

  <div property="transcript">
    <h2>Transcript</h2>
    <p>${metadata.transcript || 'No transcript available'}</p>
  </div>
</div>
`.trim();
    }

    default:
      return JSON.stringify(baseSchema, null, 2);
  }
}

/**
 * Escape HTML entities
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
 * Generate composite schema for video with related content
 * Includes VideoObject + BreadcrumbList + possibly AggregateRating
 */
export function generateCompositeVideoSchema(
  videoMetadata: VideoMetadata,
  videoPageUrl: string,
  breadcrumbs: Array<{ name: string; url: string }>,
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
    bestRating: number;
    worstRating: number;
  }
): Array<object> {
  const schemas: Array<object> = [
    generateVideoObjectSchema(videoMetadata),
    generateVideoBreadcrumbSchema(videoPageUrl, videoMetadata.name, breadcrumbs),
  ];

  if (aggregateRating) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      ratingCount: aggregateRating.ratingCount,
      bestRating: aggregateRating.bestRating,
      worstRating: aggregateRating.worstRating,
    });
  }

  return schemas;
}
