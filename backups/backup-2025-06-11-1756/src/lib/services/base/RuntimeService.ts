To fix the code quality issue of having `console.log` statements in production code, we can replace them with proper logging mechanisms such as using a logging library like `winston` or `log4js`.

Here is an example of how you can refactor the code in `RuntimeService.ts` to use `winston` for logging instead of `console.log`:

```typescript
import * as winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

export class RuntimeService {
  public async run(): Promise<void> {
    logger.info('Starting runtime service');

    // Logic for the runtime service

    logger.info('Runtime service finished');
  }
}
```

By using a logging library like `winston`, you can have more control over the logging levels, formats, and destinations of your log messages. This will also help in maintaining a better code quality and making it easier to debug issues in production.