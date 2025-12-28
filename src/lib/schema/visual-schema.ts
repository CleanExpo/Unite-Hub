/**
 * Visual Asset Schema Generators
 * Creates VideoObject and ImageObject schemas for Google ranking
 *
 * Part of Anthropic UI/UX Phase - Extractable Logic Implementation
 */

export interface VideoMetadata {
  name: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  uploadDate: string;
  segments: Array<{
    start: number;
    end: number;
    name: string;
    description: string;
  }>;
  transcript?: string;
  keywords?: string[];
}

export interface ImageMetadata {
  name: string;
  caption: string;
  url: string;
  width: number;
  height: number;
  locations?: string[]; // For GEO ranking
  githubRepo?: string;
  keywords?: string[];
}

/**
 * Generate VideoObject schema with hasPart (Key Moments)
 * Critical for Google Video Search ranking
 */
export function generateVideoObjectSchema(video: VideoMetadata) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "contentUrl": video.url,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    "duration": `PT${video.duration}S`, // ISO 8601 duration

    // KEY MOMENTS (hasPart) - Critical for "Extractable Logic"
    "hasPart": video.segments.map(segment => ({
      "@type": "Clip",
      "name": segment.name,
      "description": segment.description,
      "startOffset": segment.start,
      "endOffset": segment.end,
      "url": `${video.url}#t=${segment.start},${segment.end}`
    })),

    // Transcript for AI parsing
    "transcript": video.transcript || video.segments.map(s => `${s.name}: ${s.description}`).join(' '),

    // Publisher info
    "publisher": {
      "@type": "Organization",
      "name": "Unite-Group",
      "url": "https://www.unite-group.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.unite-group.in/logo.png"
      }
    },

    // Educational/Technical framing
    "educationalLevel": "Professional",
    "learningResourceType": "Demonstration",
    "teaches": video.keywords?.join(', ') || "AI automation, marketing automation, autonomous agents",

    // Interaction stats (placeholder - update with real data)
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/WatchAction",
      "userInteractionCount": 0
    }
  };
}

/**
 * Generate ImageObject schema with contentLocation (GEO)
 * Critical for local SEO ranking
 */
export function generateImageObjectSchema(image: ImageMetadata) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": image.url,
    "caption": image.caption,
    "width": image.width,
    "height": image.height,
    "encodingFormat": image.url.endsWith('.svg') ? 'image/svg+xml' : 'image/png',

    // Creator info
    "creator": {
      "@type": "Organization",
      "name": "Unite-Group",
      "url": "https://www.unite-group.in"
    }
  };

  // Add contentLocation for GEO ranking
  if (image.locations && image.locations.length > 0) {
    schema.contentLocation = image.locations.map(location => {
      const [city, state] = location.split(', ');
      return {
        "@type": "Place",
        "name": location,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city,
          "addressRegion": state || "QLD",
          "addressCountry": "AU"
        }
      };
    });
  }

  // Link to GitHub repo if specified
  if (image.githubRepo) {
    schema.associatedMedia = {
      "@type": "SoftwareSourceCode",
      "name": "Unite-Hub",
      "codeRepository": image.githubRepo,
      "programmingLanguage": "TypeScript",
      "runtimePlatform": "Next.js 16, React 19"
    };
  }

  // Add keywords for AI parsing
  if (image.keywords && image.keywords.length > 0) {
    schema.keywords = image.keywords.join(', ');
  }

  return schema;
}

/**
 * Generate HowTo schema with visual step icons
 * Links images to specific HowTo steps for ranking
 */
export function generateHowToWithVisuals(steps: Array<{
  name: string;
  text: string;
  image: string; // URL to step icon
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Set Up Unite-Hub AI Marketing Automation",
    "description": "Step-by-step guide to implementing autonomous AI marketing with Unite-Hub",
    "totalTime": "PT15M", // 15 minutes
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0" // Free to start
    },
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": {
        "@type": "ImageObject",
        "contentUrl": step.image,
        "caption": step.name
      },
      "url": `https://www.unite-group.in/how-to#step-${index + 1}`
    })),
    "tool": [
      {
        "@type": "SoftwareApplication",
        "name": "Unite-Hub",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser"
      }
    ]
  };
}

/**
 * Inject schema into Next.js page metadata
 */
export function createSchemaMetadata(schemas: any[]) {
  return {
    other: {
      'application/ld+json': JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
    }
  };
}

/**
 * Generate complete visual package for a Unite-Hub feature
 */
export async function generateFeatureVisualPackage(feature: {
  name: string;
  demoVideo?: VideoMetadata;
  architectureImage?: ImageMetadata;
  stepIcons?: ImageMetadata[];
}) {
  const schemas: any[] = [];

  // Add video schema if video provided
  if (feature.demoVideo) {
    schemas.push(generateVideoObjectSchema(feature.demoVideo));
  }

  // Add image schemas
  if (feature.architectureImage) {
    schemas.push(generateImageObjectSchema(feature.architectureImage));
  }

  // Add HowTo schema if step icons provided
  if (feature.stepIcons && feature.stepIcons.length > 0) {
    const howToSteps = feature.stepIcons.map((icon, index) => ({
      name: icon.name,
      text: icon.caption,
      image: icon.url
    }));
    schemas.push(generateHowToWithVisuals(howToSteps));
  }

  return {
    schemas,
    metadata: createSchemaMetadata(schemas)
  };
}
