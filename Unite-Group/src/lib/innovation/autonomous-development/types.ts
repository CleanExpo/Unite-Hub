/**
 * Types for the Autonomous Development module
 */

/**
 * Interface for a generated feature
 */
interface GeneratedFeature {
  id: string;
  name: string;
  description: string;
}

/**
 * Interface for a developed feature
 */
interface DevelopedFeature extends GeneratedFeature {
  implementationDetails: {
    components: string[];
    dependencies: string[];
    estimatedEffort: number;
  };
}

/**
 * Interface for a tested feature
 */
interface TestedFeature extends DevelopedFeature {
  testResults: {
    unitTestsPassed: boolean;
    integrationTestsPassed: boolean;
    codeCoverage: number;
  };
}

/**
 * Interface for a deployed feature
 */
interface DeployedFeature extends TestedFeature {
  deploymentDetails: {
    environment: string;
    version: string;
    deploymentTime: Date;
  };
}

export type { GeneratedFeature, DevelopedFeature, TestedFeature, DeployedFeature };
