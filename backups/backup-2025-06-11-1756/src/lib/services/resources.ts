To fix the code quality issue of `console.log` found in production code from `src\lib\services\resources.ts`, follow these steps:

1. **Replace console.logs with proper logging**:
   - Import the logging service into `resources.ts`.
   - Use the logging service to replace `console.log` calls.

```typescript
// src\lib\services\resources.ts

import { Logger } from 'common/services/logger.service'; // Import the logger service

export class ResourcesService {
  private logger: Logger;

  constructor(private readonly logger: Logger) { // Inject logger via constructor
    this.logger = logger;
  }

  public async getResources(): Promise<any> {
    try {
      // Remove 'console.log' and use logger instead
      this.logger.info('Fetching resources started');

      // ... existing code ...

      this.logger.info('Successfully fetched resources', { count: data.length });
      return data