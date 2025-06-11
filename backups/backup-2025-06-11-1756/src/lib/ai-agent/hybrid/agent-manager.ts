To fix this code quality issue, we should remove the 'console.log' statement from the production code in the 'agent-manager.ts' file. 

If the 'console.log' statement was used for debugging purposes, it should be replaced with a proper logging mechanism that is suitable for production, such as a logging library like Winston or Bunyan.

If the 'console.log' statement was used for logging important information, it should be replaced with a more robust logging solution that can handle logging in a production environment.

Here is an example of how the 'console.log' statement can be replaced with the Winston logging library:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Replace console.log with logger.info
logger.info('Information message');

// Replace console.error with logger.error
logger.error('Error message');
```

By using a proper logging library like Winston, we can ensure that our production code maintains good code quality and adheres to best practices.