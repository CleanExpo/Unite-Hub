/**
 * Ground Service - ANZ Geospatial Grounding
 *
 * Injects local landmarks, regulations, and regional context
 * to ground content in authentic ANZ professional settings.
 */

import { readFile, writeFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';

export type ANZRegion =
  | 'NSW'
  | 'VIC'
  | 'QLD'
  | 'SA'
  | 'WA'
  | 'TAS'
  | 'ACT'
  | 'NT'
  | 'NZ_North'
  | 'NZ_South';

export interface GroundOptions {
  region: ANZRegion;
  targetFile: string;
  outputPath?: string;
  includeRegulations?: boolean;
  includeLandmarks?: boolean;
  industryContext?: string;
}

export interface GroundResult {
  region: ANZRegion;
  regulationsAdded: number;
  landmarksAdded: number;
  contextInjections: number;
  outputPath: string;
}

interface RegionalContext {
  region: ANZRegion;
  regulations: RegulationReference[];
  landmarks: Landmark[];
  businessDistricts: string[];
  localTerminology: Record<string, string>;
}

interface RegulationReference {
  name: string;
  authority: string;
  relevance: string[];
  url?: string;
}

interface Landmark {
  name: string;
  type: 'business_district' | 'government' | 'transport' | 'cultural';
  relevance: string;
}

// ANZ Regional Context Database
const REGIONAL_CONTEXTS: Record<ANZRegion, RegionalContext> = {
  VIC: {
    region: 'VIC',
    regulations: [
      {
        name: 'Victorian Building Authority Regulations',
        authority: 'Victorian Building Authority (VBA)',
        relevance: ['construction', 'property', 'compliance'],
        url: 'https://www.vba.vic.gov.au',
      },
      {
        name: 'Fair Trading Act 1999',
        authority: 'Consumer Affairs Victoria',
        relevance: ['retail', 'consumer', 'business'],
        url: 'https://www.consumer.vic.gov.au',
      },
      {
        name: 'Victorian Privacy and Data Protection Act',
        authority: 'Office of the Victorian Information Commissioner',
        relevance: ['data', 'privacy', 'digital'],
        url: 'https://ovic.vic.gov.au',
      },
      {
        name: 'WorkSafe Victoria Regulations',
        authority: 'WorkSafe Victoria',
        relevance: ['workplace', 'safety', 'compliance'],
        url: 'https://www.worksafe.vic.gov.au',
      },
    ],
    landmarks: [
      { name: 'Melbourne CBD', type: 'business_district', relevance: 'Central business hub' },
      { name: 'Southbank Business Precinct', type: 'business_district', relevance: 'Corporate headquarters' },
      { name: 'Docklands', type: 'business_district', relevance: 'Tech and finance sector' },
      { name: 'Richmond', type: 'business_district', relevance: 'Creative industries' },
    ],
    businessDistricts: ['Melbourne CBD', 'Southbank', 'Docklands', 'Richmond', 'St Kilda Road'],
    localTerminology: {
      sidewalk: 'footpath',
      apartment: 'unit',
      downtown: 'CBD',
      highway: 'freeway',
    },
  },

  NSW: {
    region: 'NSW',
    regulations: [
      {
        name: 'NSW Fair Trading Act',
        authority: 'NSW Fair Trading',
        relevance: ['retail', 'consumer', 'business'],
        url: 'https://www.fairtrading.nsw.gov.au',
      },
      {
        name: 'Environmental Planning and Assessment Act',
        authority: 'NSW Department of Planning',
        relevance: ['property', 'development', 'planning'],
        url: 'https://www.planning.nsw.gov.au',
      },
      {
        name: 'Work Health and Safety Act',
        authority: 'SafeWork NSW',
        relevance: ['workplace', 'safety', 'compliance'],
        url: 'https://www.safework.nsw.gov.au',
      },
    ],
    landmarks: [
      { name: 'Sydney CBD', type: 'business_district', relevance: 'Financial hub' },
      { name: 'North Sydney', type: 'business_district', relevance: 'Corporate offices' },
      { name: 'Parramatta', type: 'business_district', relevance: 'Western Sydney business centre' },
      { name: 'Macquarie Park', type: 'business_district', relevance: 'Technology corridor' },
    ],
    businessDistricts: ['Sydney CBD', 'North Sydney', 'Parramatta', 'Macquarie Park', 'Chatswood'],
    localTerminology: {
      sidewalk: 'footpath',
      apartment: 'unit',
      downtown: 'city centre',
    },
  },

  QLD: {
    region: 'QLD',
    regulations: [
      {
        name: 'Queensland Building and Construction Commission Act',
        authority: 'Queensland Building and Construction Commission (QBCC)',
        relevance: ['construction', 'licensing', 'compliance'],
        url: 'https://www.qbcc.qld.gov.au',
      },
      {
        name: 'Fair Trading Act 1989',
        authority: 'Office of Fair Trading Queensland',
        relevance: ['consumer', 'business', 'retail'],
        url: 'https://www.qld.gov.au/law/fair-trading',
      },
      {
        name: 'Work Health and Safety Act 2011',
        authority: 'WorkSafe Queensland',
        relevance: ['workplace', 'safety'],
        url: 'https://www.worksafe.qld.gov.au',
      },
    ],
    landmarks: [
      { name: 'Brisbane CBD', type: 'business_district', relevance: 'Central business district' },
      { name: 'South Bank', type: 'business_district', relevance: 'Corporate precinct' },
      { name: 'Fortitude Valley', type: 'business_district', relevance: 'Creative industries' },
      { name: 'Gold Coast', type: 'business_district', relevance: 'Tourism and services' },
    ],
    businessDistricts: ['Brisbane CBD', 'South Bank', 'Fortitude Valley', 'Milton', 'Newstead'],
    localTerminology: {
      apartment: 'unit',
      downtown: 'CBD',
    },
  },

  SA: {
    region: 'SA',
    regulations: [
      {
        name: 'Fair Trading Act 1987',
        authority: 'Consumer and Business Services SA',
        relevance: ['consumer', 'business'],
        url: 'https://www.cbs.sa.gov.au',
      },
      {
        name: 'Work Health and Safety Act 2012',
        authority: 'SafeWork SA',
        relevance: ['workplace', 'safety'],
        url: 'https://www.safework.sa.gov.au',
      },
    ],
    landmarks: [
      { name: 'Adelaide CBD', type: 'business_district', relevance: 'Central business district' },
      { name: 'North Adelaide', type: 'business_district', relevance: 'Professional services' },
    ],
    businessDistricts: ['Adelaide CBD', 'North Adelaide', 'Unley'],
    localTerminology: {},
  },

  WA: {
    region: 'WA',
    regulations: [
      {
        name: 'Fair Trading Act 2010',
        authority: 'Consumer Protection WA',
        relevance: ['consumer', 'business'],
        url: 'https://www.commerce.wa.gov.au',
      },
      {
        name: 'Work Health and Safety Act 2020',
        authority: 'WorkSafe WA',
        relevance: ['workplace', 'safety'],
        url: 'https://www.commerce.wa.gov.au/worksafe',
      },
    ],
    landmarks: [
      { name: 'Perth CBD', type: 'business_district', relevance: 'Central business district' },
      { name: 'West Perth', type: 'business_district', relevance: 'Corporate offices' },
    ],
    businessDistricts: ['Perth CBD', 'West Perth', 'Subiaco'],
    localTerminology: {},
  },

  TAS: {
    region: 'TAS',
    regulations: [
      {
        name: 'Fair Trading Act 1990',
        authority: 'Consumer, Building and Occupational Services',
        relevance: ['consumer', 'business'],
        url: 'https://www.cbos.tas.gov.au',
      },
    ],
    landmarks: [
      { name: 'Hobart CBD', type: 'business_district', relevance: 'Central business district' },
    ],
    businessDistricts: ['Hobart CBD', 'Battery Point'],
    localTerminology: {},
  },

  ACT: {
    region: 'ACT',
    regulations: [
      {
        name: 'Fair Trading (Australian Consumer Law) Act 1992',
        authority: 'Access Canberra',
        relevance: ['consumer', 'business'],
        url: 'https://www.accesscanberra.act.gov.au',
      },
    ],
    landmarks: [
      { name: 'Canberra City', type: 'business_district', relevance: 'Central business district' },
      { name: 'Civic', type: 'business_district', relevance: 'Government and corporate' },
    ],
    businessDistricts: ['Civic', 'Barton', 'Deakin'],
    localTerminology: {},
  },

  NT: {
    region: 'NT',
    regulations: [
      {
        name: 'Consumer Affairs and Fair Trading Act',
        authority: 'NT Consumer Affairs',
        relevance: ['consumer', 'business'],
        url: 'https://nt.gov.au/industry/consumer-rights',
      },
    ],
    landmarks: [
      { name: 'Darwin CBD', type: 'business_district', relevance: 'Central business district' },
    ],
    businessDistricts: ['Darwin CBD', 'Stuart Park'],
    localTerminology: {},
  },

  NZ_North: {
    region: 'NZ_North',
    regulations: [
      {
        name: 'Fair Trading Act 1986',
        authority: 'Commerce Commission NZ',
        relevance: ['consumer', 'business'],
        url: 'https://www.comcom.govt.nz',
      },
      {
        name: 'Health and Safety at Work Act 2015',
        authority: 'WorkSafe NZ',
        relevance: ['workplace', 'safety'],
        url: 'https://www.worksafe.govt.nz',
      },
    ],
    landmarks: [
      { name: 'Auckland CBD', type: 'business_district', relevance: 'Central business district' },
      { name: 'Wellington CBD', type: 'business_district', relevance: 'Government and corporate' },
    ],
    businessDistricts: ['Auckland CBD', 'Wellington CBD', 'Newmarket'],
    localTerminology: {},
  },

  NZ_South: {
    region: 'NZ_South',
    regulations: [
      {
        name: 'Fair Trading Act 1986',
        authority: 'Commerce Commission NZ',
        relevance: ['consumer', 'business'],
        url: 'https://www.comcom.govt.nz',
      },
    ],
    landmarks: [
      { name: 'Christchurch CBD', type: 'business_district', relevance: 'Central business district' },
    ],
    businessDistricts: ['Christchurch CBD', 'Riccarton'],
    localTerminology: {},
  },
};

export class GroundService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async groundLocal(options: GroundOptions): Promise<GroundResult> {
    console.log(`[Ground] Loading content from ${options.targetFile}...`);

    // Read file
    const content = await readFile(options.targetFile, 'utf-8');

    // Get regional context
    const context = REGIONAL_CONTEXTS[options.region];
    if (!context) {
      throw new Error(`Unknown region: ${options.region}`);
    }

    console.log(`[Ground] Applying ${options.region} geospatial grounding...`);

    // Apply grounding
    const grounded = await this.applyGrounding(content, context, options);

    // Parse metrics
    const metrics = this.calculateMetrics(content, grounded, context);

    // Write to file
    const outputPath = options.outputPath || options.targetFile.replace(/\.md$/, '_grounded.md');
    await writeFile(outputPath, grounded, 'utf-8');

    console.log(`[Ground] Added ${metrics.regulationsAdded} regulations, ${metrics.landmarksAdded} landmarks`);

    return {
      region: options.region,
      regulationsAdded: metrics.regulationsAdded,
      landmarksAdded: metrics.landmarksAdded,
      contextInjections: metrics.contextInjections,
      outputPath,
    };
  }

  private async applyGrounding(
    content: string,
    context: RegionalContext,
    options: GroundOptions
  ): Promise<string> {
    const systemPrompt = `You are an expert in Australian and New Zealand business contexts.

Your task is to ground generic business content in specific ${context.region} regional context by:

1. Adding relevant local regulations where compliance is mentioned
2. Referencing local business districts and landmarks where location matters
3. Converting American terminology to local terminology
4. Adding regional specificity without changing core meaning

${options.includeRegulations ? `
Available Regulations for ${context.region}:
${context.regulations.map((r) => `- ${r.name} (${r.authority}): ${r.relevance.join(', ')}`).join('\n')}
` : ''}

${options.includeLandmarks ? `
Key Business Locations in ${context.region}:
${context.landmarks.map((l) => `- ${l.name}: ${l.relevance}`).join('\n')}
` : ''}

Local Terminology Conversions:
${Object.entries(context.localTerminology).map(([us, anz]) => `- "${us}" → "${anz}"`).join('\n')}

RULES:
1. Only add context where it genuinely fits
2. Do NOT force landmarks into every sentence
3. Preserve all original facts and data
4. Maintain professional tone
5. Use Australian English spelling (optimise, organisation, colour)
6. Keep changes subtle and natural`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Ground this content with ${context.region} regional context${options.industryContext ? ` (Industry: ${options.industryContext})` : ''}:

${content}`,
        },
      ],
    });

    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return responseContent.text;
  }

  private calculateMetrics(
    original: string,
    grounded: string,
    context: RegionalContext
  ): {
    regulationsAdded: number;
    landmarksAdded: number;
    contextInjections: number;
  } {
    let regulationsAdded = 0;
    let landmarksAdded = 0;

    // Count regulation references
    for (const reg of context.regulations) {
      const pattern = new RegExp(reg.name, 'gi');
      const matches = grounded.match(pattern);
      if (matches) {
        regulationsAdded += matches.length;
      }
    }

    // Count landmark references
    for (const landmark of context.landmarks) {
      const pattern = new RegExp(landmark.name, 'gi');
      const matches = grounded.match(pattern);
      if (matches) {
        landmarksAdded += matches.length;
      }
    }

    // Count terminology conversions
    let contextInjections = 0;
    for (const [us, anz] of Object.entries(context.localTerminology)) {
      const usPattern = new RegExp(us, 'gi');
      const usInOriginal = (original.match(usPattern) || []).length;
      const usInGrounded = (grounded.match(usPattern) || []).length;
      const anzInGrounded = (grounded.match(new RegExp(anz, 'gi')) || []).length;

      // If US term was replaced with ANZ term
      if (usInOriginal > usInGrounded && anzInGrounded > 0) {
        contextInjections += usInOriginal - usInGrounded;
      }
    }

    return {
      regulationsAdded,
      landmarksAdded,
      contextInjections: contextInjections + regulationsAdded + landmarksAdded,
    };
  }

  getRegionalContext(region: ANZRegion): RegionalContext | undefined {
    return REGIONAL_CONTEXTS[region];
  }

  listAvailableRegions(): ANZRegion[] {
    return Object.keys(REGIONAL_CONTEXTS) as ANZRegion[];
  }
}
