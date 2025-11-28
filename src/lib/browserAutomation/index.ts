/**
 * Browser Automation Library
 *
 * Clean exports for browser automation functionality.
 */

// Types
export * from './browserTypes';

// Session State Store
export {
  sessionStateStore,
  type CreateSessionOptions,
  type UpdateStateOptions,
} from './sessionStateStore';

// DOM Cache Service
export {
  domCacheService,
  type CaptureDomOptions,
  type FindElementOptions,
} from './domCacheService';

// Replay Service
export {
  replayService,
  type CreateTaskOptions,
  type RunTaskOptions,
  type TaskFilters,
} from './replayService';

// Pattern Learner Service
export {
  patternLearnerService,
  type LearnFromActionsOptions,
  type PatternMatchResult,
  type PatternFilters,
} from './patternLearnerService';
