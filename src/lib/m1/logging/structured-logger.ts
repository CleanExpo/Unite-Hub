/**
 * M1 Structured Logger
 *
 * Provides structured logging with Winston for all M1 operations.
 * Enables JSON logging, filtering by level, and file-based persistence.
 */

import winston from "winston";

/**
 * Create logs directory if it doesn't exist (Node.js only)
 */
function ensureLogsDirectory() {
  try {
    const fs = require("fs");
    const path = require("path");
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    // Silently fail if not in Node.js environment
  }
}

/**
 * Initialize Winston logger with file and console transports
 */
function createLogger() {
  ensureLogsDirectory();

  const transports: winston.transport[] = [];

  // Console transport - always include
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );

  // File transports - only in Node.js
  try {
    require("fs");
    transports.push(
      new winston.transports.File({
        filename: "logs/m1-error.log",
        level: "error",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      }),
      new winston.transports.File({
        filename: "logs/m1-combined.log",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );
  } catch (error) {
    // File transports not available (e.g., browser environment)
  }

  return winston.createLogger({
    level: process.env.M1_LOG_LEVEL || "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: "m1-agent-control" },
    transports,
  });
}

export const m1Logger = createLogger();

/**
 * Log agent run start event
 */
export function logAgentStart(data: {
  runId: string;
  agentName: string;
  goal: string;
}): void {
  m1Logger.info("Agent Run Started", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log agent run completion event
 */
export function logAgentComplete(data: {
  runId: string;
  stopReason: string;
  durationMs: number;
  toolCallsProposed: number;
  toolCallsExecuted: number;
}): void {
  m1Logger.info("Agent Run Completed", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log agent run error event
 */
export function logAgentError(data: {
  runId: string;
  error: string;
  durationMs: number;
}): void {
  m1Logger.error("Agent Run Error", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log tool execution start
 */
export function logToolExecutionStart(data: {
  requestId: string;
  toolName: string;
  scope: string;
}): void {
  m1Logger.debug("Tool Execution Starting", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log tool execution completion
 */
export function logToolExecutionEnd(data: {
  requestId: string;
  toolName: string;
  duration: number;
  success: boolean;
  error?: string;
}): void {
  const level = data.success ? "info" : "error";
  m1Logger[level as "info" | "error"]("Tool Execution Completed", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log policy decision
 */
export function logPolicyDecision(data: {
  toolName: string;
  allowed: boolean;
  reason?: string;
  scope: string;
}): void {
  const level = data.allowed ? "debug" : "warn";
  m1Logger[level as "debug" | "warn"]("Policy Decision", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log approval request
 */
export function logApprovalRequest(data: {
  requestId: string;
  toolName: string;
  scope: string;
}): void {
  m1Logger.info("Approval Request", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log approval grant
 */
export function logApprovalGrant(data: {
  requestId: string;
  toolName: string;
  approvedBy: string;
}): void {
  m1Logger.info("Approval Granted", {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Log approval denial
 */
export function logApprovalDenial(data: {
  requestId: string;
  toolName: string;
  reason?: string;
}): void {
  m1Logger.warn("Approval Denied", {
    ...data,
    timestamp: Date.now(),
  });
}
