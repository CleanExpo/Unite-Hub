// src/lib/content/brand-identities.ts
// Seed data for CARSI and RestoreAssist brand identities.
// Characters: Ada (female) and Jax (male) — consistent across all businesses.

import { createServiceClient } from '@/lib/supabase/service'
import type { BrandIdentity, CharacterPersona } from './types'

// ── Shared Characters ───────────────────────────────────────────────────────

const ADA: CharacterPersona = {
  name: 'Ada',
  persona: 'Warm, knowledgeable, approachable. The face of customer-facing content. Explains complex topics simply with genuine empathy.',
  avatarUrl: null,
  voiceStyle: 'Conversational, reassuring, friendly Australian accent',
}

const JAX: CharacterPersona = {
  name: 'Jax',
  persona: 'Confident, authoritative, solutions-focused. The face of industry expertise. Drives trust and authority with practical insights.',
  avatarUrl: null,
  voiceStyle: 'Direct, professional, knowledgeable Australian accent',
}

// ── CARSI Brand Identity ────────────────────────────────────────────────────

export const CARSI_BRAND: Omit<BrandIdentity, 'id' | 'founderId' | 'createdAt' | 'updatedAt'> = {
  businessKey: 'carsi',
  toneOfVoice: 'Warm, professional, community-focused. Speak like a trusted local expert who genuinely cares about keeping Australians safe on the road.',
  targetAudience: 'Australian car owners needing roadside assistance, car insurance comparison, and vehicle protection. Age 25-65, metro and regional areas.',
  industryKeywords: [
    'roadside assistance Australia',
    'car insurance comparison',
    'breakdown cover',
    'vehicle protection',
    'roadside help',
    'car breakdown',
    'emergency roadside',
    'towing service',
    'RACQ alternative',
    'NRMA alternative',
    'car insurance quote',
    'comprehensive car insurance',
  ],
  uniqueSellingPoints: [
    'Compare multiple providers in one place',
    'Fast roadside response times',
    'No lock-in contracts',
    'Australian-owned and operated',
    'Covers metro and regional areas',
  ],
  characterMale: { ...JAX, persona: 'Experienced roadside expert. Knows every breakdown scenario. Gives confident, practical advice about vehicle protection and insurance.' },
  characterFemale: { ...ADA, persona: 'Friendly insurance guide. Makes complex policy comparisons simple. Empathetic when customers are stranded or stressed.' },
  colourPrimary: '#eab308',
  colourSecondary: '#ca8a04',
  doList: [
    'Use Australian English (colour, behaviour, tyre)',
    'Reference Australian roads, conditions, and seasons',
    'Mention specific coverage benefits with real scenarios',
    'Include a clear call-to-action in every post',
    'Use statistics about Australian road incidents when relevant',
    'Be empathetic — breakdowns are stressful',
  ],
  dontList: [
    'Never use American English or reference US insurance',
    'Never make specific price promises',
    'Never disparage competitor brands by name',
    'Never use fear-mongering tactics',
    'Never claim "cheapest" without verification',
  ],
  sampleContent: {
    facebook: 'Stuck on the side of the M1 at 6am? We\'ve all been there. \uD83D\uDE97 CARSI connects you with roadside help in minutes \u2014 no membership lock-ins, no hidden fees. Compare providers and get covered today.',
    instagram: 'POV: Your battery dies in a Woolies car park \uD83D\uDD0B\uD83D\uDE05\n\nDon\'t stress \u2014 CARSI has your back.\n\u2705 Fast response\n\u2705 No lock-in contracts\n\u2705 Compare & save\n\nLink in bio \uD83D\uDC46\n\n#roadsideassistance #carinsurance #australia',
  },
}

// ── RestoreAssist Brand Identity ────────────────────────────────────────────

export const RESTOREASSIST_BRAND: Omit<BrandIdentity, 'id' | 'founderId' | 'createdAt' | 'updatedAt'> = {
  businessKey: 'restore',
  toneOfVoice: 'Empathetic, authoritative, solution-oriented. Speak like a knowledgeable restoration professional who understands the emotional toll of property damage.',
  targetAudience: 'Australian property owners dealing with disaster damage (flood, fire, storm, water damage). Homeowners, landlords, property managers, and insurance professionals. Age 30-65.',
  industryKeywords: [
    'disaster restoration Australia',
    'flood damage repair',
    'fire damage restoration',
    'water damage cleanup',
    'storm damage repair',
    'property restoration',
    'insurance claim restoration',
    'mould remediation',
    'disaster recovery property',
    'emergency restoration services',
    'building restoration',
    'content restoration',
  ],
  uniqueSellingPoints: [
    'End-to-end restoration management platform',
    'Streamlines insurance claim documentation',
    'Real-time job tracking and reporting',
    'Connects property owners with certified restorers',
    'Australian-built for Australian conditions',
  ],
  characterMale: { ...JAX, persona: 'Authoritative restoration specialist. Knows the science behind water damage, mould, and structural drying. Commands trust with technical expertise.' },
  characterFemale: { ...ADA, persona: 'Compassionate claims advisor. Guides property owners through the overwhelming restoration process with patience and clarity.' },
  colourPrimary: '#22c55e',
  colourSecondary: '#16a34a',
  doList: [
    'Use Australian English',
    'Reference Australian weather events (La Nina, cyclones, bushfire seasons)',
    'Mention insurance claim processes specific to Australia',
    'Share educational content about damage prevention',
    'Include before/after imagery prompts when relevant',
    'Be empathetic \u2014 property damage is devastating',
    'Reference IICRC standards for restoration',
  ],
  dontList: [
    'Never use American English or reference FEMA/US systems',
    'Never minimise the emotional impact of property damage',
    'Never make guarantees about insurance claim outcomes',
    'Never provide specific legal or insurance advice',
    'Never use disaster imagery in a sensational way',
  ],
  sampleContent: {
    facebook: 'When a burst pipe turns your living room into a wading pool at 2am, you need more than a mop. \uD83D\uDCA7 RestoreAssist connects you with certified restoration professionals who know exactly how to dry, treat, and restore your property \u2014 and we help manage your insurance claim every step of the way.',
    linkedin: 'Property restoration in Australia is evolving. At RestoreAssist, we\'re building technology that streamlines the entire restoration lifecycle \u2014 from emergency response to final sign-off.\n\nFor property managers and insurers: real-time job tracking, automated documentation, and certified restorer networks.\n\n#PropertyRestoration #InsurTech #Australia',
  },
}

// ── Seed Function ────────────────────────────────────────────────────────────

/** Upsert CARSI and RestoreAssist brand identities into the database. */
export async function seedBrandIdentities(founderId: string): Promise<void> {
  const supabase = createServiceClient()

  const brands = [CARSI_BRAND, RESTOREASSIST_BRAND]

  for (const brand of brands) {
    const row = {
      founder_id: founderId,
      business_key: brand.businessKey,
      tone_of_voice: brand.toneOfVoice,
      target_audience: brand.targetAudience,
      industry_keywords: brand.industryKeywords,
      unique_selling_points: brand.uniqueSellingPoints,
      character_male: brand.characterMale,
      character_female: brand.characterFemale,
      colour_primary: brand.colourPrimary,
      colour_secondary: brand.colourSecondary,
      do_list: brand.doList,
      dont_list: brand.dontList,
      sample_content: brand.sampleContent,
    }

    const { error } = await supabase
      .from('brand_identities')
      .upsert(row, { onConflict: 'business_key' })

    if (error) {
      console.error(`[BrandIdentity] Failed to seed ${brand.businessKey}:`, error.message)
    } else {
      console.log(`[BrandIdentity] Seeded ${brand.businessKey}`)
    }
  }
}
