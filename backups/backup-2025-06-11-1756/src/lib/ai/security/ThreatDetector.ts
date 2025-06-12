To fix the code quality issue of having a console.log statement in production code, you should remove or replace the console.log statement with a proper logging mechanism that is suitable for production environments. 

Here is an example of how you can refactor the code in ThreatDetector.ts to use a logger:

```typescript
import Logger from '../../util/Logger';

class ThreatDetector {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ThreatDetector');
  }

  detectThreat(threat: string) {
    // Perform threat detection logic
    if (threat === 'high') {
      this.logger.error('High threat detected: ' + threat);
    } else {
      this.logger.info('Low threat detected: ' + threat);
    }
  }
}

export default ThreatDetector;
```

In this refactored code, we have removed the console.log statement and introduced a Logger class for handling logging in a more organized way. The Logger class can be customized to log messages at different levels (e.g., info, error, debug) and can be configured to write logs to different destinations (e.g., console, file, database). 

You can adjust the logging level and configuration of the Logger class based on your requirements and deployment environment. This approach ensures that logging in production code is handled properly and can be effectively managed.