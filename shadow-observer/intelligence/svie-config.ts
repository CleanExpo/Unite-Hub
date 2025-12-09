/**
 * Intelligence Layer Configuration
 * Shared configuration for APPM, SRRE, and other intelligence modules
 */

export interface SVIEConfigType {
  skillRoot: string;
  reportDir: string;
  maxFileSize: number;
  weights: {
    usage: number;
    expertise: number;
    health: number;
    performance: number;
  };
}

export const svieConfig: SVIEConfigType = {
  skillRoot: 'src/lib/agents',
  reportDir: 'reports',
  maxFileSize: 50 * 1024,  // 50KB - flag files larger than this
  weights: {
    usage: 0.4,           // 40% - how often is it used
    expertise: 0.25,      // 25% - complexity and value
    health: 0.2,          // 20% - code quality and maintenance
    performance: 0.15     // 15% - how well it performs
  }
};
