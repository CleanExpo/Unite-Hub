One way to fix this issue is to remove the console.log statement from the production code. Console.log statements are typically used for debugging purposes and should not be present in production code.

Instead of using console.log, you can consider using a proper logging library such as Winston or Bunyan to log messages to a file or a centralized logging system.

Here is an example of how you can refactor the code to use Winston for logging instead of console.log:

```typescript
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
```

By using a proper logging library like Winston, you can maintain better control over logging in your production code and avoid accidental logging of sensitive information.