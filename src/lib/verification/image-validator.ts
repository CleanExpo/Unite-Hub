/**
 * Image Validation Agent - V1.1
 * Task-007: Verification System - Phased Implementation
 *
 * Verifies uploaded images are valid property damage photos before processing.
 *
 * Checks:
 * - Is it a valid image (not corrupted)?
 * - Is it a photo (not screenshot, document, meme)?
 * - Does it show property/building/structure?
 * - Does it show damage (water, fire, mould, structural)?
 * - Is it clear enough to assess?
 * - Is it safe (no inappropriate content)?
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import {
  VerificationResult,
  ImageValidationResult,
  DamageType,
  ImageQuality,
  VerificationError,
} from './types';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Validation thresholds
const CONFIDENCE_THRESHOLD = 0.7;
const MIN_IMAGE_SIZE = 50 * 1024; // 50KB minimum
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB maximum
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Validate an uploaded image for property damage assessment
 */
export async function validateImage(
  imageData: string | Buffer,
  mimeType: string,
  options: {
    strict_mode?: boolean;
    require_damage?: boolean;
    context?: string;
  } = {}
): Promise<VerificationResult<ImageValidationResult>> {
  const startTime = Date.now();
  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
    // Step 1: Basic validation
    const basicValidation = validateBasicImageProperties(imageData, mimeType);
    if (!basicValidation.valid) {
      return {
        status: 'failed',
        passed: false,
        message: basicValidation.message,
        errors: [
          {
            code: 'INVALID_IMAGE',
            message: basicValidation.message,
            severity: 'critical',
          },
        ],
        data: {
          is_valid_image: false,
          is_property_photo: false,
          shows_damage: false,
          damage_type: 'none',
          image_quality: 'unusable',
          confidence: 0,
          rejection_reason: basicValidation.message,
          suggestions: basicValidation.suggestions,
        },
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    // Step 2: AI-powered image analysis
    const analysisResult = await analyzeImageWithGemini(imageData, mimeType, options.context);

    // Step 3: Apply validation rules
    const validationResult = applyValidationRules(analysisResult, options);

    // Build response
    const passed =
      validationResult.is_valid_image &&
      validationResult.is_property_photo &&
      validationResult.image_quality !== 'unusable' &&
      (!options.require_damage || validationResult.shows_damage);

    if (!passed) {
      if (!validationResult.is_valid_image) {
        errors.push({
          code: 'NOT_VALID_IMAGE',
          message: 'The uploaded file is not a valid photograph',
          severity: 'critical',
        });
      }
      if (!validationResult.is_property_photo) {
        errors.push({
          code: 'NOT_PROPERTY_PHOTO',
          message: 'The image does not appear to show a property or building',
          severity: 'error',
        });
        suggestions.push('Please upload a photo that clearly shows the property or affected area');
      }
      if (validationResult.image_quality === 'unusable') {
        errors.push({
          code: 'POOR_QUALITY',
          message: 'The image quality is too poor for assessment',
          severity: 'error',
        });
        suggestions.push('Please upload a clearer, well-lit photo');
      }
      if (options.require_damage && !validationResult.shows_damage) {
        errors.push({
          code: 'NO_DAMAGE_VISIBLE',
          message: 'No visible damage detected in the image',
          severity: 'warning',
        });
        suggestions.push('Please upload photos that clearly show the damage');
      }
    }

    // Add warnings for edge cases
    if (validationResult.image_quality === 'poor') {
      warnings.push('Image quality is acceptable but could be better');
      suggestions.push('For best results, ensure good lighting and focus');
    }
    if (validationResult.confidence < CONFIDENCE_THRESHOLD) {
      warnings.push(`Analysis confidence is lower than expected (${(validationResult.confidence * 100).toFixed(0)}%)`);
    }

    return {
      status: passed ? 'passed' : errors.some((e) => e.severity === 'critical') ? 'failed' : 'warning',
      passed,
      message: passed
        ? `Image validated successfully (${validationResult.damage_type} damage detected)`
        : validationResult.rejection_reason || 'Image validation failed',
      data: validationResult,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      status: 'failed',
      passed: false,
      message: 'Image validation failed due to an internal error',
      errors: [
        {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'critical',
        },
      ],
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Validate basic image properties (size, format, etc.)
 */
function validateBasicImageProperties(
  imageData: string | Buffer,
  mimeType: string
): { valid: boolean; message: string; suggestions: string[] } {
  const suggestions: string[] = [];

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      message: `Unsupported image format: ${mimeType}`,
      suggestions: ['Please upload a JPEG, PNG, or WebP image'],
    };
  }

  // Calculate size
  let size: number;
  if (typeof imageData === 'string') {
    // Base64 encoded
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    size = Buffer.from(base64Data, 'base64').length;
  } else {
    size = imageData.length;
  }

  // Check minimum size
  if (size < MIN_IMAGE_SIZE) {
    return {
      valid: false,
      message: 'Image file is too small (likely too low resolution)',
      suggestions: ['Please upload a higher resolution image (minimum 50KB)'],
    };
  }

  // Check maximum size
  if (size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      message: 'Image file is too large (maximum 20MB)',
      suggestions: ['Please compress the image or reduce its resolution'],
    };
  }

  return { valid: true, message: 'Basic validation passed', suggestions };
}

/**
 * Analyze image using Gemini Vision
 */
async function analyzeImageWithGemini(
  imageData: string | Buffer,
  mimeType: string,
  context?: string
): Promise<ImageValidationResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  // Prepare image part
  let base64Data: string;
  if (typeof imageData === 'string') {
    base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  } else {
    base64Data = imageData.toString('base64');
  }

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const prompt = `You are an expert property damage assessor. Analyze this image and provide a detailed assessment.

${context ? `Context: ${context}` : ''}

Analyze the image and respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "is_valid_image": boolean (true if this is a real photograph, not a screenshot, document, or meme),
  "is_property_photo": boolean (true if shows a building, room, property, or structural element),
  "shows_damage": boolean (true if visible damage is present),
  "damage_type": "water" | "fire" | "mould" | "structural" | "biohazard" | "storm" | "unknown" | "none",
  "damage_severity": "minor" | "moderate" | "severe" | "catastrophic" | null,
  "image_quality": "high" | "acceptable" | "poor" | "unusable",
  "confidence": number between 0 and 1,
  "detected_elements": {
    "building": boolean,
    "interior": boolean,
    "exterior": boolean,
    "water_damage": boolean,
    "fire_damage": boolean,
    "mould_visible": boolean,
    "structural_damage": boolean
  },
  "rejection_reason": string or null (if image should be rejected, explain why),
  "suggestions": string[] (helpful suggestions for the user)
}

Assessment criteria:
- VALID IMAGE: Must be a real photograph, not a screenshot, document scan, meme, or digitally generated image
- PROPERTY PHOTO: Must clearly show a building, room, wall, floor, ceiling, or property structure
- DAMAGE VISIBLE: Look for water stains, discoloration, mould growth, burn marks, cracks, warping, structural issues
- QUALITY: Image must be clear enough to assess damage - not too dark, blurry, or partial

Be strict but fair. If unsure, set confidence lower and provide suggestions.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const analysis = JSON.parse(jsonMatch[0]) as ImageValidationResult;

    // Ensure required fields have defaults
    return {
      is_valid_image: analysis.is_valid_image ?? false,
      is_property_photo: analysis.is_property_photo ?? false,
      shows_damage: analysis.shows_damage ?? false,
      damage_type: analysis.damage_type ?? 'none',
      damage_severity: analysis.damage_severity ?? undefined,
      image_quality: analysis.image_quality ?? 'poor',
      confidence: Math.min(1, Math.max(0, analysis.confidence ?? 0.5)),
      rejection_reason: analysis.rejection_reason ?? null,
      suggestions: analysis.suggestions ?? [],
      detected_elements: analysis.detected_elements ?? {
        building: false,
        interior: false,
        exterior: false,
        water_damage: false,
        fire_damage: false,
        mould_visible: false,
        structural_damage: false,
      },
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);

    // Return conservative defaults on error
    return {
      is_valid_image: true, // Assume valid if we can't analyze
      is_property_photo: false,
      shows_damage: false,
      damage_type: 'unknown',
      image_quality: 'poor',
      confidence: 0.3,
      rejection_reason: 'Unable to fully analyze image',
      suggestions: ['Please ensure the image is clear and shows the property damage'],
    };
  }
}

/**
 * Apply additional validation rules to the AI analysis
 */
function applyValidationRules(
  analysis: ImageValidationResult,
  options: { strict_mode?: boolean; require_damage?: boolean }
): ImageValidationResult {
  const result = { ...analysis };

  // In strict mode, require higher confidence
  if (options.strict_mode && result.confidence < CONFIDENCE_THRESHOLD) {
    result.suggestions = [
      ...result.suggestions,
      'Analysis confidence is low. Consider uploading a clearer image.',
    ];
  }

  // If damage is detected, ensure damage type is set
  if (result.shows_damage && result.damage_type === 'none') {
    result.damage_type = 'unknown';
  }

  // If no damage detected but damage elements found, flag inconsistency
  if (!result.shows_damage && result.detected_elements) {
    const damageElements =
      result.detected_elements.water_damage ||
      result.detected_elements.fire_damage ||
      result.detected_elements.mould_visible ||
      result.detected_elements.structural_damage;

    if (damageElements) {
      result.shows_damage = true;
      result.suggestions = [
        ...result.suggestions,
        'Some damage indicators were detected. Please confirm the damage type.',
      ];
    }
  }

  return result;
}

/**
 * Batch validate multiple images
 */
export async function validateImageBatch(
  images: Array<{ data: string | Buffer; mimeType: string; id?: string }>,
  options: { strict_mode?: boolean; require_damage?: boolean } = {}
): Promise<Map<string, VerificationResult<ImageValidationResult>>> {
  const results = new Map<string, VerificationResult<ImageValidationResult>>();

  // Process in parallel with concurrency limit
  const BATCH_SIZE = 3;
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (img, idx) => {
        const id = img.id || `image_${i + idx}`;
        const result = await validateImage(img.data, img.mimeType, options);
        return { id, result };
      })
    );

    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
  }

  return results;
}

/**
 * Quick validation (basic checks only, no AI)
 */
export function quickValidateImage(
  imageData: string | Buffer,
  mimeType: string
): { valid: boolean; message: string } {
  const result = validateBasicImageProperties(imageData, mimeType);
  return { valid: result.valid, message: result.message };
}

export default {
  validateImage,
  validateImageBatch,
  quickValidateImage,
};
