import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

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

// File transports (only in production or if LOG_TO_FILE is enabled)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
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

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  transports,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(process.env.LOG_DIR || 'logs', 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(process.env.LOG_DIR || 'logs', 'rejections.log') }),
  ],
});

// Export logger and convenience methods
export default logger;

// Convenience methods with contextual logging
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};

// API-specific logger with request tracking
export function createApiLogger(context: { route?: string; userId?: string; requestId?: string }) {
  return {
    error: (message: string, meta?: any) =>
      logger.error(message, { ...context, ...meta }),
    warn: (message: string, meta?: any) =>
      logger.warn(message, { ...context, ...meta }),
    info: (message: string, meta?: any) =>
      logger.info(message, { ...context, ...meta }),
    http: (message: string, meta?: any) =>
      logger.http(message, { ...context, ...meta }),
    debug: (message: string, meta?: any) =>
      logger.debug(message, { ...context, ...meta }),
  };
}

// Audit logging for sensitive operations
export function auditLog(action: string, userId: string, details: any) {
  logger.info('AUDIT', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
}

// Performance logging
export function perfLog(operation: string, duration: number, meta?: any) {
  logger.info('PERF', {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
}

// Security logging
export function securityLog(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) {
  const logMethod = severity === 'critical' || severity === 'high' ? logger.error : logger.warn;
  logMethod('SECURITY', {
    event,
    severity,
    details,
    timestamp: new Date().toISOString(),
  });
}
