To fix the code quality issue of having a console.log statement in production code, you should remove or replace it with proper logging using a logging library. Here's an example of how you can refactor the code to use a logging library like Winston:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

class AutonomousProductDeveloper {
  developProduct() {
    // Your code here
    
    // Replace console.log statements with proper logging
    logger.info('Product developed successfully');
  }
}

export default AutonomousProductDeveloper;
```

By using a logging library like Winston, you can properly manage and control the logging output in your production code without using console.log statements directly.