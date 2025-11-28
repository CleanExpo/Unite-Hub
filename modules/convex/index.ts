/**
 * CONVEX Marketing Intelligence Module
 *
 * High-conversion marketing intelligence powered by the CONVEX methodology.
 *
 * @module convex
 */

// API exports
export * from "./api/convexLibrary";
export * from "./api/convexScores";

// Re-export types
export type {
  ConvexFramework,
  ReasoningPattern,
  ExecutionTemplate,
  ConvexStrategy
} from "./api/convexLibrary";

export type {
  SEOScore,
  SEOScoreDetail,
  StrategyScore,
  ContentScore
} from "./api/convexScores";
