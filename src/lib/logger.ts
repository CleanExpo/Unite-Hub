import winston from 'winston';
import path from 'path';

// Detect serverless environment (Vercel, AWS Lambda) where filesystem is read-only
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format,
  })
);

// Database transport (autonomous monitoring - enabled in production)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DB_LOGGING === 'true') {
  // Lazy load to avoid circular dependencies
  import('./monitoring/winston-database-transport').then(({ DatabaseTransport }) => {
    const dbTransport = new DatabaseTransport();
    // Add to logger's transports
    logger.add(dbTransport);
    console.log('✅ Database logging transport enabled');
  }).catch(err => {
    console.warn('⚠️  Failed to load database transport:', err.message);
  });
}

// File transports (only when filesystem is writable - skip on serverless platforms)
if (!isServerless && (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true')) {
  const DailyRotateFile = require('winston-daily-rotate-file');
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

  // Error log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );

  // Combined log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Exception/rejection handlers - only use file handlers when filesystem is writable
const exceptionHandlers: winston.transport[] = [new winston.transports.Console()];
const rejectionHandlers: winston.transport[] = [new winston.transports.Console()];

if (!isServerless) {
  const logDir = process.env.LOG_DIR || 'logs';
  exceptionHandlers.push(
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  );
  rejectionHandlers.push(
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  transports,
  exceptionHandlers,
  rejectionHandlers,
});

// Export logger and convenience methods
export default logger;

// Convenience methods with contextual logging
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  http: (message: string, meta?: Record<string, unknown>) => logger.http(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
};

// API-specific logger with request tracking
export function createApiLogger(context: { route?: string; userId?: string; requestId?: string }) {
  return {
    error: (message: string, meta?: Record<string, unknown>) =>
      logger.error(message, { ...context, ...meta }),
    warn: (message: string, meta?: Record<string, unknown>) =>
      logger.warn(message, { ...context, ...meta }),
    info: (message: string, meta?: Record<string, unknown>) =>
      logger.info(message, { ...context, ...meta }),
    http: (message: string, meta?: Record<string, unknown>) =>
      logger.http(message, { ...context, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) =>
      logger.debug(message, { ...context, ...meta }),
  };
}

// Audit logging for sensitive operations
export function auditLog(action: string, userId: string, details: Record<string, unknown>) {
  logger.info('AUDIT', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
}

// Performance logging
export function perfLog(operation: string, duration: number, meta?: Record<string, unknown>) {
  logger.info('PERF', {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
}

// Security logging
export function securityLog(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, unknown>) {
  const logMethod = severity === 'critical' || severity === 'high' ? logger.error : logger.warn;
  logMethod('SECURITY', {
    event,
    severity,
    details,
    timestamp: new Date().toISOString(),
  });
}
