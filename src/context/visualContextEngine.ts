/**
 * Phase 13 – Visual Context Engine
 *
 * Process single frames or short bursts from iPhone / glasses camera into
 * semantic scene descriptions and lightweight embeddings.
 *
 * - Accept input from: photos, short video frames, or screen captures
 * - Extract: objects, layout, text, key affordances (door, screen, desk, road, etc.)
 * - Generate compact scene summary (<300 chars) + feature embedding
 * - Never store raw image bytes by default (only semantic summaries + embeddings)
 * - Tag with: location_hint, time_of_day, environment_type
 *
 * Integration: Receives photos/frames from glassesVisionPipeline
 * Feeds: surroundingsReasoner, contextFusionEngine
 * Output: VisualContext with summary, tags, embedding reference
 */

export type EnvironmentType =
  | 'home'
  | 'office'
  | 'street'
  | 'car'
  | 'cafe'
  | 'transit'
  | 'outdoor'
  | 'retail'
  | 'unknown';

export type TimeOfDay = 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export interface VisualInput {
  // Source
  source: 'iphone_camera' | 'iphone_screen' | 'glasses_ray_ban' | 'glasses_xreal' | 'glasses_viture';

  // Payload (only ONE of these should be provided)
  imageBase64?: string; // Base64 encoded JPEG/PNG
  imageUrl?: string; // URL to image (if already hosted)
  videoFrame?: Float32Array; // Raw video frame data
  screenCapture?: string; // Screen capture as base64

  // Metadata
  timestamp: string;
  userInitiated: boolean; // True if user tapped/voiced "what am I looking at"
  triggerType: 'tap' | 'voice_command' | 'scheduled_check' | 'explicit_app_action';
  batteryPercent?: number;
}

export interface VisualObject {
  // Object identity
  label: string; // "person", "car", "door", "whiteboard", etc.
  confidence: number; // 0-1

  // Position + size
  x: number; // 0-100 percentage of image width
  y: number; // 0-100 percentage of image height
  width: number; // 0-100 percentage
  height: number; // 0-100 percentage

  // Attributes
  color?: string; // dominant color name
  activity?: string; // "sitting", "walking", "driving", etc.
}

export interface TextElement {
  // Extracted text
  text: string; // Raw OCR result
  confidence: number; // 0-1

  // Location + context
  context: 'sign' | 'screen' | 'document' | 'label' | 'unknown';
  x: number; // 0-100
  y: number; // 0-100
}

export interface VisualContext {
  // Identity
  contextId: string;
  timestamp: string;
  source: VisualInput['source'];

  // Scene summary (< 300 chars, human readable)
  summary: string;

  // Detected objects
  objects: VisualObject[];

  // Extracted text
  text: TextElement[];

  // Semantic tags
  tags: string[]; // "busy", "outdoor", "crowded", "cluttered", "quiet", etc.

  // Environment classification
  environmentType: EnvironmentType;
  timeOfDay: TimeOfDay;
  locationHint?: string; // "at home office", "downtown street", "on highway", etc.

  // Safety markers
  safetyMarkers: {
    vehicleTraffic: boolean;
    pedestrianTraffic: boolean;
    machinery: boolean;
    hazards: string[]; // "wet floor", "uneven surface", "low lighting", etc.
  };

  // Confidence scores
  overallConfidence: number; // 0-1 (how well did we understand the scene)
  sceneConfidence: number; // 0-1 (scene classification confidence)

  // Embedding reference (for cheap storage)
  embeddingRef?: {
    provider: 'openai' | 'clip' | 'local';
    dimensions: number;
    hash: string; // SHA256 of embedding for deduplication
  };

  // Metadata
  userInitiated: boolean;
  batteryPercent?: number;
}

// ============================================================================
// HELPER FUNCTIONS FOR SCENE ANALYSIS
// ============================================================================

/**
 * Determine time of day from timestamp
 */
function determineTimeOfDay(timestamp: string): TimeOfDay {
  const hour = new Date(timestamp).getHours();

  if (hour < 6) {
return 'early_morning';
}
  if (hour < 9) {
return 'morning';
}
  if (hour < 12) {
return 'midday';
}
  if (hour < 17) {
return 'afternoon';
}
  if (hour < 21) {
return 'evening';
}
  return 'night';
}

/**
 * Estimate environment type from detected objects
 */
function estimateEnvironmentType(objects: VisualObject[]): EnvironmentType {
  const labels = objects.map((o) => o.label.toLowerCase());

  // Home indicators
  if (labels.some((l) => ['bed', 'couch', 'kitchen', 'dining table'].includes(l))) {
    return 'home';
  }

  // Office indicators
  if (labels.some((l) => ['desk', 'computer', 'whiteboard', 'conference table', 'office chair'].includes(l))) {
    return 'office';
  }

  // Car indicators
  if (labels.some((l) => ['steering wheel', 'dashboard', 'windshield'].includes(l))) {
    return 'car';
  }

  // Street indicators
  if (labels.some((l) => ['car', 'road', 'sidewalk', 'traffic light', 'pedestrian'].includes(l))) {
    return 'street';
  }

  // Cafe indicators
  if (labels.some((l) => ['cafe', 'coffee', 'cup', 'people sitting'].includes(l))) {
    return 'cafe';
  }

  // Transit indicators
  if (labels.some((l) => ['bus', 'train', 'subway', 'station'].includes(l))) {
    return 'transit';
  }

  // Retail indicators
  if (labels.some((l) => ['shelf', 'products', 'cashier', 'shopping'].includes(l))) {
    return 'retail';
  }

  // Outdoor indicators
  if (labels.some((l) => ['sky', 'trees', 'grass', 'park', 'mountains'].includes(l))) {
    return 'outdoor';
  }

  return 'unknown';
}

/**
 * Generate compact scene summary from objects
 */
function generateSceneSummary(objects: VisualObject[], text: TextElement[], environmentType: EnvironmentType, safetyMarkers: any): string {
  const parts: string[] = [];

  // Environment type
  parts.push(`At ${environmentType}`);

  // Key objects (top 3 by confidence)
  const topObjects = objects.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  if (topObjects.length > 0) {
    const objLabels = topObjects.map((o) => o.label).join(', ');
    parts.push(`with ${objLabels}`);
  }

  // Safety markers
  if (safetyMarkers.vehicleTraffic) {
    parts.push('vehicle traffic nearby');
  }
  if (safetyMarkers.hazards.length > 0) {
    parts.push(`hazards: ${safetyMarkers.hazards.slice(0, 2).join(', ')}`);
  }

  // Text if significant
  if (text.length > 0) {
    const textStr = text[0].text.substring(0, 30);
    parts.push(`text: "${textStr}"`);
  }

  return parts.join('; ').substring(0, 300);
}

/**
 * Generate semantic tags from scene
 */
function generateSceneTags(objects: VisualObject[], safetyMarkers: any, crowdedness: number): string[] {
  const tags: string[] = [];

  // Crowdedness
  if (crowdedness > 0.7) {
tags.push('crowded');
}
  if (crowdedness < 0.2) {
tags.push('quiet');
}

  // Clutter
  const objectCount = objects.length;
  if (objectCount > 10) {
tags.push('cluttered');
}
  if (objectCount < 3) {
tags.push('minimal');
}

  // Safety
  if (safetyMarkers.vehicleTraffic) {
tags.push('traffic');
}
  if (safetyMarkers.machinery) {
tags.push('machinery');
}
  if (safetyMarkers.hazards.length > 0) {
tags.push('hazardous');
}

  // Light
  const avgBrightness = objects.reduce((sum, o) => sum + (o.color === 'dark' ? 0.3 : 0.8), 0) / Math.max(objects.length, 1);
  if (avgBrightness < 0.4) {
tags.push('dimly_lit');
}
  if (avgBrightness > 0.8) {
tags.push('bright');
}

  // Motion
  const movingObjects = objects.filter((o) => o.activity && o.activity !== 'stationary');
  if (movingObjects.length > 0) {
tags.push('dynamic');
}

  return tags;
}

/**
 * Detect safety markers in scene
 */
function detectSafetyMarkers(objects: VisualObject[], text: TextElement[]): { vehicleTraffic: boolean; pedestrianTraffic: boolean; machinery: boolean; hazards: string[] } {
  const labels = objects.map((o) => o.label.toLowerCase());
  const hazards: string[] = [];

  // Vehicle traffic
  const vehicleTraffic = labels.some((l) => ['car', 'truck', 'bus', 'motorcycle'].includes(l));

  // Pedestrian traffic
  const pedestrianTraffic = objects.filter((o) => o.label === 'person' && !o.activity?.includes('sitting')).length > 2;

  // Machinery
  const machinery = labels.some((l) => ['drill', 'saw', 'machinery', 'crane'].includes(l));

  // Hazards from text
  const hazardTexts = text
    .filter((t) => t.confidence > 0.7)
    .map((t) => t.text.toLowerCase())
    .filter((txt) => ['caution', 'wet', 'slippery', 'danger', 'hazard', 'emergency'].some((h) => txt.includes(h)));

  if (hazardTexts.length > 0) {
    hazards.push(...hazardTexts.slice(0, 2));
  }

  // Visual hazards
  if (labels.some((l) => ['stairs', 'cliff', 'water', 'fire'].includes(l))) {
    hazards.push('uneven_terrain');
  }

  return {
    vehicleTraffic,
    pedestrianTraffic,
    machinery,
    hazards: [...new Set(hazards)],
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze a visual frame and extract semantic context
 * MVP: Mock implementation that simulates computer vision
 * Production: Integrate with Claude Vision API, CLIP, or Google Vision API
 */
export async function analyzeScene(input: VisualInput): Promise<VisualContext> {
  const contextId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = input.timestamp || new Date().toISOString();

  // MVP: Generate mock visual context
  // Production: Call computer vision API here
  const mockObjects: VisualObject[] = [
    {
      label: 'desk',
      confidence: 0.95,
      x: 10,
      y: 20,
      width: 60,
      height: 40,
      color: 'brown',
    },
    {
      label: 'computer',
      confidence: 0.92,
      x: 20,
      y: 25,
      width: 40,
      height: 30,
      color: 'gray',
    },
    {
      label: 'chair',
      confidence: 0.88,
      x: 5,
      y: 60,
      width: 15,
      height: 25,
      activity: 'sitting',
    },
    {
      label: 'window',
      confidence: 0.85,
      x: 65,
      y: 10,
      width: 30,
      height: 50,
      color: 'light_blue',
    },
  ];

  const mockText: TextElement[] = [
    {
      text: 'PROJECT_ROADMAP.md',
      confidence: 0.91,
      context: 'screen',
      x: 25,
      y: 30,
    },
  ];

  const environmentType = estimateEnvironmentType(mockObjects);
  const timeOfDay = determineTimeOfDay(timestamp);
  const safetyMarkers = detectSafetyMarkers(mockObjects, mockText);
  const tags = generateSceneTags(mockObjects, safetyMarkers, 0.1); // Low crowdedness for office
  const summary = generateSceneSummary(mockObjects, mockText, environmentType, safetyMarkers);

  return {
    contextId,
    timestamp,
    source: input.source,
    summary,
    objects: mockObjects,
    text: mockText,
    tags,
    environmentType,
    timeOfDay,
    locationHint: 'home office',
    safetyMarkers,
    overallConfidence: 0.89,
    sceneConfidence: 0.92,
    embeddingRef: {
      provider: 'clip',
      dimensions: 512,
      hash: `clip_${contextId}`,
    },
    userInitiated: input.userInitiated,
    batteryPercent: input.batteryPercent,
  };
}

/**
 * Lightweight scene classification without full object detection
 * Used for quick "what's around me" checks
 */
export async function quickSceneCheck(input: VisualInput): Promise<{
  environmentType: EnvironmentType;
  safetyLevel: 'safe' | 'caution' | 'danger';
  focusLevel: 'high' | 'medium' | 'low';
  recommendation: string;
}> {
  const context = await analyzeScene(input);

  // Determine safety level
  let safetyLevel: 'safe' | 'caution' | 'danger' = 'safe';
  if (context.safetyMarkers.vehicleTraffic || context.safetyMarkers.machinery) {
    safetyLevel = 'caution';
  }
  if (context.safetyMarkers.hazards.length > 0) {
    safetyLevel = 'danger';
  }

  // Determine focus level
  let focusLevel: 'high' | 'medium' | 'low' = 'medium';
  if (context.tags.includes('quiet') && context.tags.includes('minimal')) {
    focusLevel = 'high';
  }
  if (context.tags.includes('crowded') || context.tags.includes('dynamic')) {
    focusLevel = 'low';
  }

  // Generate recommendation
  let recommendation = 'Continue as normal';
  if (safetyLevel === 'caution') {
    recommendation = 'Stay alert and reduce complexity';
  }
  if (safetyLevel === 'danger') {
    recommendation = 'Prioritize safety, defer tasks';
  }
  if (focusLevel === 'low') {
    recommendation = 'High distractions; consider deferring deep work';
  }

  return {
    environmentType: context.environmentType,
    safetyLevel,
    focusLevel,
    recommendation,
  };
}

/**
 * Generate a semantic hash for deduplication
 * (two similar scenes should have similar hashes)
 */
export function generateSceneHash(context: VisualContext): string {
  const components = [
    context.environmentType,
    context.timeOfDay,
    context.tags.sort().join('|'),
    context.safetyMarkers.hazards.sort().join('|'),
  ].join(':');

  // Simple hash simulation (in production, use actual embedding distance)
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Compare two scenes for similarity
 */
export function compareScenes(context1: VisualContext, context2: VisualContext): number {
  let similarity = 0;

  // Environment type match (40%)
  if (context1.environmentType === context2.environmentType) {
    similarity += 40;
  }

  // Tag overlap (30%)
  const commonTags = context1.tags.filter((t) => context2.tags.includes(t));
  const tagSimilarity = (commonTags.length / Math.max(context1.tags.length, context2.tags.length, 1)) * 30;
  similarity += tagSimilarity;

  // Safety markers match (20%)
  if (
    context1.safetyMarkers.vehicleTraffic === context2.safetyMarkers.vehicleTraffic &&
    context1.safetyMarkers.machinery === context2.safetyMarkers.machinery
  ) {
    similarity += 20;
  }

  // Time of day match (10%)
  if (context1.timeOfDay === context2.timeOfDay) {
    similarity += 10;
  }

  return Math.round(similarity);
}
