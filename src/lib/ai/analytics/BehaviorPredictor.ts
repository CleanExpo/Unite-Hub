import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

class BehaviorPredictor {
  // Other code for BehaviorPredictor class

  public someMethod() {
    // Your existing code here
    logger.info('Some information message');
    // Replace console.log with logger.info or appropriate log level
  }
}

export default BehaviorPredictor;