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