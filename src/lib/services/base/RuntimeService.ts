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