To fix the code quality issue caused by `console.log` statements in production, we need to remove or replace them with proper logging. Here's a step-by-step solution:

**1. Remove `console.log`:**
Delete `console.log` statements entirely. They should not exist in production code.

**2. Integrate a Logging Service:**
Use `winston`, `bunyan`, `log4js`, or similar in a TypeScript project. Here's a basic `winston` setup example:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/production.log' })
  ]
});

// Usage in ProductionAIService
class ProductionAIService {
  private readonly logger = logger.child({ service: 'ai-gateway' });

  async callAI(prompt: string): Promise<string> {
    this.logger.info('Calling AI service with prompt', { prompt });
    try {
      const response = await this.service.call(prompt);
      this.logger.info('AI response received', { response });
      return response;
    } catch (error) {
      this.logger.error('Error calling AI service', { error });
      throw error;
    }
  }
}
```

**Explanation:**

- **Level-Specific Logging:** Use `info`, `error`, `warn` to categorize messages. Adjust the `level` in `createLogger` to filter logs (e.g., set to `error` to minimize output).
  
- **Structured Logging:** Add metadata (like `prompt`, `response`, `error`) via objects to improve stack parsing and filtering.

- **Transport Configuration:** Logs go to both console and file. Adjust transports for your environment (e.g., CloudWatch, Elasticsearch).

**3. Environment Configuration:**
Use environment variables to configure logging levels:

```typescript
const { LOG_LEVEL = 'info' } = process.env;
const logger = winston.createLogger({
  level: LOG_LEVEL,
  // ... other configuration
});
```

**Key Takeaways:**

- Always replace `console.log` with a logging library.
  
- Configure logging levels (e.g., `info` for production, `debug` for development).

- Maintain structured logs for better monitoring and debugging.

By following these steps, the application will remove `console.log` statements and adopt a production-ready logging strategy.