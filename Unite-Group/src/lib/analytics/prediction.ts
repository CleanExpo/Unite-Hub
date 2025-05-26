/**
 * Analytics Prediction Module
 * 
 * This module provides utilities for predictive analytics, including:
 * - Conversion prediction
 * - Customer segmentation
 * - Feature engineering for ML/AI
 */

import type { 
  AnalyticsEvent, 
  PredictionModel, 
  PredictionModelType 
} from './types';

/**
 * Feature vector for machine learning models
 */
export interface FeatureVector {
  /**
   * User ID associated with this feature vector
   */
  userId?: string;
  
  /**
   * Anonymous ID if user is not authenticated
   */
  anonymousId?: string;
  
  /**
   * Timestamp when the features were extracted
   */
  timestamp: string;
  
  /**
   * Feature values
   */
  features: Record<string, number>;
  
  /**
   * Target variable (for training data)
   */
  target?: number | string;
  
  /**
   * Predicted value (for inference)
   */
  prediction?: number | string;
  
  /**
   * Prediction confidence or probability
   */
  confidence?: number;
  
  /**
   * Feature importances (if available)
   */
  featureImportance?: Record<string, number>;
}

/**
 * Customer segment definition
 */
export interface CustomerSegment {
  /**
   * Segment ID
   */
  id: string;
  
  /**
   * Segment name
   */
  name: string;
  
  /**
   * Segment description
   */
  description?: string;
  
  /**
   * Conditions that define the segment
   */
  conditions: Array<{
    /**
     * Feature name
     */
    feature: string;
    
    /**
     * Operator
     */
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'not_in';
    
    /**
     * Value to compare against
     */
    value: any;
  }>;
  
  /**
   * Created date
   */
  createdAt: string;
  
  /**
   * Last updated date
   */
  updatedAt: string;
}

/**
 * Conversion prediction result
 */
export interface ConversionPrediction {
  /**
   * User ID
   */
  userId?: string;
  
  /**
   * Anonymous ID
   */
  anonymousId?: string;
  
  /**
   * Prediction timestamp
   */
  timestamp: string;
  
  /**
   * Probability of conversion (0-1)
   */
  probability: number;
  
  /**
   * Predicted time to conversion (in days)
   */
  predictedTimeToConversion?: number;
  
  /**
   * Top factors influencing the prediction
   */
  topFactors: Array<{
    /**
     * Factor name
     */
    factor: string;
    
    /**
     * Factor importance (higher means more important)
     */
    importance: number;
    
    /**
     * Whether this factor increases or decreases conversion probability
     */
    direction: 'positive' | 'negative';
  }>;
  
  /**
   * Type of conversion predicted
   */
  conversionType: 'purchase' | 'signup' | 'consultation' | 'contact' | string;
  
  /**
   * Model ID used for the prediction
   */
  modelId: string;
  
  /**
   * Model version
   */
  modelVersion: string;
}

/**
 * Feature definition for a prediction model
 */
export interface FeatureDefinition {
  /**
   * Feature name
   */
  name: string;
  
  /**
   * Feature description
   */
  description?: string;
  
  /**
   * Feature type
   */
  type: 'numeric' | 'categorical' | 'boolean' | 'timestamp';
  
  /**
   * Source of the feature
   */
  source: 'event' | 'user' | 'session' | 'derived' | 'external';
  
  /**
   * Feature extraction logic
   */
  extraction: {
    /**
     * Type of extraction
     */
    type: 'direct' | 'aggregation' | 'transformation' | 'custom';
    
    /**
     * Source field (e.g., event property, user attribute)
     */
    field?: string;
    
    /**
     * Aggregation function (if applicable)
     */
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
    
    /**
     * Transformation function (if applicable)
     */
    transformation?: 'log' | 'sqrt' | 'standardize' | 'normalize' | 'oneHot' | 'binning';
    
    /**
     * Custom extraction function (if applicable)
     */
    customFunction?: string;
    
    /**
     * Time window for aggregation (in days)
     */
    timeWindow?: number;
  };
  
  /**
   * Feature importance (if known)
   */
  importance?: number;
}

/**
 * Convert user events to features for ML/AI models
 * @param events User events
 * @param featureDefinitions Feature definitions
 * @returns Feature vector
 */
export function extractFeaturesFromEvents(
  events: AnalyticsEvent[],
  featureDefinitions: FeatureDefinition[]
): FeatureVector {
  if (!events || events.length === 0) {
    throw new Error('No events provided for feature extraction');
  }
  
  // Get user information from the most recent event
  const latestEvent = events[events.length - 1];
  const userId = latestEvent.userId;
  const anonymousId = latestEvent.sessionId; // Using session ID as anonymous ID
  
  // Initialize feature vector
  const featureVector: FeatureVector = {
    userId,
    anonymousId,
    timestamp: new Date().toISOString(),
    features: {},
  };
  
  // Extract features based on definitions
  for (const featureDef of featureDefinitions) {
    try {
      switch (featureDef.extraction.type) {
        case 'direct':
          extractDirectFeature(events, featureDef, featureVector);
          break;
          
        case 'aggregation':
          extractAggregatedFeature(events, featureDef, featureVector);
          break;
          
        case 'transformation':
          extractTransformedFeature(events, featureDef, featureVector);
          break;
          
        case 'custom':
          // Custom feature extraction would be implemented separately
          break;
      }
    } catch (error) {
      console.error(`Error extracting feature ${featureDef.name}:`, error);
      // Skip this feature and continue with others
    }
  }
  
  return featureVector;
}

/**
 * Extract a direct feature from events
 */
function extractDirectFeature(
  events: AnalyticsEvent[],
  featureDef: FeatureDefinition,
  featureVector: FeatureVector
): void {
  const { field } = featureDef.extraction;
  
  if (!field) {
    throw new Error(`Field must be specified for direct feature extraction: ${featureDef.name}`);
  }
  
  // Get the latest event
  const latestEvent = events[events.length - 1];
  
  // Extract the field from the event
  let value;
  
  // Check if field is in properties
  if (latestEvent.properties && field in latestEvent.properties) {
    value = latestEvent.properties[field];
  } 
  // Check if field is in dimensions
  else if (latestEvent.dimensions && field in latestEvent.dimensions) {
    value = (latestEvent.dimensions as Record<string, any>)[field];
  }
  // Check if field is in metrics
  else if (latestEvent.metrics && field in latestEvent.metrics) {
    value = (latestEvent.metrics as Record<string, any>)[field];
  }
  // Check if field is a top-level property of the event
  else if (field in latestEvent) {
    value = (latestEvent as any)[field];
  }
  
  // Convert the value to a number if possible
  if (value !== undefined && value !== null) {
    if (typeof value === 'boolean') {
      featureVector.features[featureDef.name] = value ? 1 : 0;
    } else if (!isNaN(Number(value))) {
      featureVector.features[featureDef.name] = Number(value);
    } else if (typeof value === 'string' && featureDef.type === 'categorical') {
      // For categorical features, we'd need to encode them
      // This is a simplified version - in practice, you'd use a proper encoding scheme
      featureVector.features[featureDef.name] = hashString(value);
    }
  }
}

/**
 * Extract an aggregated feature from events
 */
function extractAggregatedFeature(
  events: AnalyticsEvent[],
  featureDef: FeatureDefinition,
  featureVector: FeatureVector
): void {
  const { field, aggregation, timeWindow = 30 } = featureDef.extraction;
  
  if (!field || !aggregation) {
    throw new Error(`Field and aggregation must be specified for aggregated feature extraction: ${featureDef.name}`);
  }
  
  // Filter events by time window if specified
  let filteredEvents = events;
  if (timeWindow) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
    filteredEvents = events.filter(event => new Date(event.timestamp) >= cutoffDate);
  }
  
  // Extract values from filtered events
  const values: number[] = [];
  
  for (const event of filteredEvents) {
    let value;
    
    // Check if field is in properties
    if (event.properties && field in event.properties) {
      value = event.properties[field];
    } 
    // Check if field is in dimensions
    else if (event.dimensions && field in event.dimensions) {
      value = (event.dimensions as Record<string, any>)[field];
    }
    // Check if field is in metrics
    else if (event.metrics && field in event.metrics) {
      value = (event.metrics as Record<string, any>)[field];
    }
    // Check if field is a top-level property of the event
    else if (field in event) {
      value = (event as any)[field];
    }
    
    // Convert the value to a number if possible
    if (value !== undefined && value !== null && !isNaN(Number(value))) {
      values.push(Number(value));
    }
  }
  
  // Apply aggregation function
  if (values.length > 0) {
    switch (aggregation) {
      case 'count':
        featureVector.features[featureDef.name] = values.length;
        break;
        
      case 'sum':
        featureVector.features[featureDef.name] = values.reduce((sum, val) => sum + val, 0);
        break;
        
      case 'avg':
        featureVector.features[featureDef.name] = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
        
      case 'min':
        featureVector.features[featureDef.name] = Math.min(...values);
        break;
        
      case 'max':
        featureVector.features[featureDef.name] = Math.max(...values);
        break;
        
      case 'first':
        featureVector.features[featureDef.name] = values[0];
        break;
        
      case 'last':
        featureVector.features[featureDef.name] = values[values.length - 1];
        break;
    }
  } else {
    // If no values found, set a default value
    featureVector.features[featureDef.name] = 0;
  }
}

/**
 * Extract a transformed feature from events
 */
function extractTransformedFeature(
  events: AnalyticsEvent[],
  featureDef: FeatureDefinition,
  featureVector: FeatureVector
): void {
  const { field, transformation } = featureDef.extraction;
  
  if (!field || !transformation) {
    throw new Error(`Field and transformation must be specified for transformed feature extraction: ${featureDef.name}`);
  }
  
  // First extract the raw feature value
  const tempFeatureVector: FeatureVector = {
    timestamp: featureVector.timestamp,
    features: {},
  };
  
  extractDirectFeature(events, { ...featureDef, extraction: { type: 'direct', field } }, tempFeatureVector);
  
  const rawValue = tempFeatureVector.features[featureDef.name];
  
  if (rawValue === undefined) {
    // If raw value couldn't be extracted, set a default value
    featureVector.features[featureDef.name] = 0;
    return;
  }
  
  // Apply transformation
  switch (transformation) {
    case 'log':
      // Add a small value to avoid log(0)
      featureVector.features[featureDef.name] = Math.log(rawValue + 1e-10);
      break;
      
    case 'sqrt':
      featureVector.features[featureDef.name] = Math.sqrt(Math.max(0, rawValue));
      break;
      
    case 'standardize':
      // Standardization requires mean and standard deviation, which would be precomputed
      // This is a placeholder implementation
      featureVector.features[featureDef.name] = rawValue;
      break;
      
    case 'normalize':
      // Normalization requires min and max values, which would be precomputed
      // This is a placeholder implementation
      featureVector.features[featureDef.name] = rawValue;
      break;
      
    case 'oneHot':
      // One-hot encoding requires the set of all possible values
      // This is a placeholder implementation
      featureVector.features[featureDef.name] = rawValue;
      break;
      
    case 'binning':
      // Binning requires bin boundaries
      // This is a placeholder implementation
      featureVector.features[featureDef.name] = rawValue;
      break;
  }
}

/**
 * Simple string hashing function for categorical features
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
}

/**
 * Check if a user belongs to a segment
 * @param featureVector User feature vector
 * @param segment Customer segment definition
 * @returns Whether the user belongs to the segment
 */
export function isUserInSegment(
  featureVector: FeatureVector,
  segment: CustomerSegment
): boolean {
  // Check all conditions
  for (const condition of segment.conditions) {
    const { feature, operator, value } = condition;
    
    // Get feature value
    const featureValue = featureVector.features[feature];
    
    // Skip if feature is not available
    if (featureValue === undefined) {
      return false;
    }
    
    // Check condition
    switch (operator) {
      case 'eq':
        if (featureValue !== value) return false;
        break;
        
      case 'neq':
        if (featureValue === value) return false;
        break;
        
      case 'gt':
        if (featureValue <= value) return false;
        break;
        
      case 'gte':
        if (featureValue < value) return false;
        break;
        
      case 'lt':
        if (featureValue >= value) return false;
        break;
        
      case 'lte':
        if (featureValue > value) return false;
        break;
        
      case 'between':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new Error(`Invalid 'between' condition value for feature ${feature}: ${value}`);
        }
        if (featureValue < value[0] || featureValue > value[1]) return false;
        break;
        
      case 'in':
        if (!Array.isArray(value)) {
          throw new Error(`Invalid 'in' condition value for feature ${feature}: ${value}`);
        }
        if (!value.includes(featureValue)) return false;
        break;
        
      case 'not_in':
        if (!Array.isArray(value)) {
          throw new Error(`Invalid 'not_in' condition value for feature ${feature}: ${value}`);
        }
        if (value.includes(featureValue)) return false;
        break;
    }
  }
  
  // All conditions passed
  return true;
}

/**
 * Segment users based on their feature vectors
 * @param featureVectors User feature vectors
 * @param segments Customer segment definitions
 * @returns Mapping of segment IDs to arrays of user IDs
 */
export function segmentUsers(
  featureVectors: FeatureVector[],
  segments: CustomerSegment[]
): Record<string, string[]> {
  const segmentMap: Record<string, string[]> = {};
  
  // Initialize segment map
  for (const segment of segments) {
    segmentMap[segment.id] = [];
  }
  
  // Process each feature vector
  for (const featureVector of featureVectors) {
    const userId = featureVector.userId || featureVector.anonymousId;
    
    if (!userId) {
      continue;
    }
    
    // Check each segment
    for (const segment of segments) {
      if (isUserInSegment(featureVector, segment)) {
        segmentMap[segment.id].push(userId);
      }
    }
  }
  
  return segmentMap;
}

/**
 * Generate a simple conversion prediction based on user events
 * This is a placeholder implementation - in a real system, this would use a trained ML model
 * @param events User events
 * @returns Conversion prediction
 */
export function predictConversion(events: AnalyticsEvent[]): ConversionPrediction {
  if (!events || events.length === 0) {
    throw new Error('No events provided for conversion prediction');
  }
  
  // Get user information from the most recent event
  const latestEvent = events[events.length - 1];
  const userId = latestEvent.userId;
  const anonymousId = latestEvent.sessionId;
  
  // Simple heuristic scoring based on user activity
  let score = 0;
  const factors: Array<{ factor: string; importance: number; direction: 'positive' | 'negative' }> = [];
  
  // Count page views
  const pageViews = events.filter(e => e.type === 'page_view').length;
  score += Math.min(pageViews, 10) * 0.02;
  factors.push({
    factor: 'Page Views',
    importance: 0.2,
    direction: 'positive',
  });
  
  // Check for product views
  const productViews = events.filter(e => e.type === 'product_view').length;
  score += Math.min(productViews, 5) * 0.05;
  factors.push({
    factor: 'Product Views',
    importance: 0.25,
    direction: 'positive',
  });
  
  // Check for add to cart events
  const addToCartEvents = events.filter(e => e.type === 'add_to_cart').length;
  score += Math.min(addToCartEvents, 3) * 0.1;
  factors.push({
    factor: 'Items Added to Cart',
    importance: 0.5,
    direction: 'positive',
  });
  
  // Check for begin checkout events
  const beginCheckoutEvents = events.filter(e => e.type === 'begin_checkout').length;
  score += Math.min(beginCheckoutEvents, 1) * 0.2;
  factors.push({
    factor: 'Started Checkout',
    importance: 0.7,
    direction: 'positive',
  });
  
  // Check for consultation requests
  const consultationRequests = events.filter(e => e.type === 'consultation_request').length;
  score += Math.min(consultationRequests, 1) * 0.3;
  factors.push({
    factor: 'Consultation Request',
    importance: 0.8,
    direction: 'positive',
  });
  
  // Cap the score at 0.95
  score = Math.min(score, 0.95);
  
  // Sort factors by importance
  factors.sort((a, b) => b.importance - a.importance);
  
  // Take top 3 factors
  const topFactors = factors.slice(0, 3);
  
  return {
    userId,
    anonymousId,
    timestamp: new Date().toISOString(),
    probability: score,
    predictedTimeToConversion: Math.max(1, 30 * (1 - score)), // Simple inverse relationship
    topFactors,
    conversionType: 'purchase',
    modelId: 'simple-heuristic-model',
    modelVersion: '1.0.0',
  };
}

/**
 * Common feature definitions for conversion prediction
 */
export const CONVERSION_PREDICTION_FEATURES: FeatureDefinition[] = [
  {
    name: 'page_view_count',
    description: 'Number of pages viewed',
    type: 'numeric',
    source: 'event',
    extraction: {
      type: 'aggregation',
      field: 'type',
      aggregation: 'count',
      timeWindow: 30,
    },
    importance: 0.2,
  },
  {
    name: 'product_view_count',
    description: 'Number of products viewed',
    type: 'numeric',
    source: 'event',
    extraction: {
      type: 'aggregation',
      field: 'type',
      aggregation: 'count',
      timeWindow: 30,
    },
    importance: 0.25,
  },
  {
    name: 'add_to_cart_count',
    description: 'Number of items added to cart',
    type: 'numeric',
    source: 'event',
    extraction: {
      type: 'aggregation',
      field: 'type',
      aggregation: 'count',
      timeWindow: 30,
    },
    importance: 0.5,
  },
  {
    name: 'begin_checkout_count',
    description: 'Number of checkout starts',
    type: 'numeric',
    source: 'event',
    extraction: {
      type: 'aggregation',
      field: 'type',
      aggregation: 'count',
      timeWindow: 30,
    },
    importance: 0.7,
  },
  {
    name: 'consultation_request_count',
    description: 'Number of consultation requests',
    type: 'numeric',
    source: 'event',
    extraction: {
      type: 'aggregation',
      field: 'type',
      aggregation: 'count',
      timeWindow: 30,
    },
    importance: 0.8,
  },
];

/**
 * Common customer segments
 */
export const COMMON_CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'high-value-prospects',
    name: 'High-Value Prospects',
    description: 'Users who have shown high engagement and are likely to convert',
    conditions: [
      {
        feature: 'page_view_count',
        operator: 'gte',
        value: 5,
      },
      {
        feature: 'product_view_count',
        operator: 'gte',
        value: 2,
      },
      {
        feature: 'begin_checkout_count',
        operator: 'gte',
        value: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cart-abandoners',
    name: 'Cart Abandoners',
    description: 'Users who added items to cart but did not complete checkout',
    conditions: [
      {
        feature: 'add_to_cart_count',
        operator: 'gte',
        value: 1,
      },
      {
        feature: 'begin_checkout_count',
        operator: 'eq',
        value: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'consultation-seekers',
    name: 'Consultation Seekers',
    description: 'Users interested in consultations',
    conditions: [
      {
        feature: 'consultation_request_count',
        operator: 'gte',
        value: 1,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'casual-browsers',
    name: 'Casual Browsers',
    description: 'Users who browse but show low engagement',
    conditions: [
      {
        feature: 'page_view_count',
        operator: 'between',
        value: [1, 3],
      },
      {
        feature: 'product_view_count',
        operator: 'lt',
        value: 2,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
