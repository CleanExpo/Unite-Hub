import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'performance-monitor' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

class PerformanceMonitor {
  // Other methods and properties for the PerformanceMonitor class

  monitorPerformance() {
    // Perform monitoring logic

    // Replace console.log with logger.info
    logger.info('Performance monitoring complete');
  }
}

export default PerformanceMonitor;