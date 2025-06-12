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