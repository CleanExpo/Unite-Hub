/**
 * Quantum Computing Foundation Types
 * Unite Group - Version 15.0 Phase 1 Implementation
 */

// Core Quantum Computing Types
export interface QuantumProcessor {
  quantumOptimization: QuantumOptimizationEngine;
  hybridMLPipeline: QuantumClassicalMLFramework;
  quantumSafeEncryption: PostQuantumCryptography;
  realTimeQuantumProcessing: QuantumStreamProcessor;
}

export interface QuantumOptimizationEngine {
  // Optimization Problem Types
  solveOptimizationProblem(problem: OptimizationProblem): Promise<QuantumOptimizationResult>;
  validateQuantumAdvantage(problem: OptimizationProblem): Promise<QuantumAdvantageAnalysis>;
  optimizeBusinessProcesses(processes: BusinessProcess[]): Promise<ProcessOptimizationResult>;
  performPortfolioOptimization(portfolio: InvestmentPortfolio): Promise<PortfolioOptimizationResult>;
  
  // Real-time Optimization
  enableRealTimeOptimization(constraints: OptimizationConstraints): Promise<RealTimeOptimizer>;
  monitorOptimizationPerformance(): Promise<OptimizationMetrics>;
  adaptOptimizationStrategy(feedback: OptimizationFeedback): Promise<StrategyAdaptation>;
}

export interface OptimizationProblem {
  type: OptimizationProblemType;
  variables: OptimizationVariable[];
  constraints: OptimizationConstraint[];
  objectiveFunction: ObjectiveFunction;
  complexity: ProblemComplexity;
  quantumAdvantageExpected: boolean;
  timeoutMs: number;
}

export type OptimizationProblemType = 
  | 'quadratic_unconstrained_binary'
  | 'traveling_salesman'
  | 'portfolio_optimization'
  | 'scheduling_optimization'
  | 'resource_allocation'
  | 'network_optimization'
  | 'supply_chain_optimization'
  | 'financial_risk_optimization';

export interface OptimizationVariable {
  name: string;
  type: 'binary' | 'integer' | 'continuous' | 'categorical';
  domain: VariableDomain;
  weight: number;
  constraints: VariableConstraint[];
}

export interface VariableDomain {
  min?: number;
  max?: number;
  discrete_values?: any[];
  probability_distribution?: ProbabilityDistribution;
}

export interface VariableConstraint {
  type: 'equality' | 'inequality' | 'bound' | 'logical';
  expression: string;
  tolerance: number;
}

export interface OptimizationConstraint {
  id: string;
  type: ConstraintType;
  variables: string[];
  expression: string;
  priority: ConstraintPriority;
  feasibilityTolerance: number;
}

export type ConstraintType = 
  | 'linear_equality'
  | 'linear_inequality'
  | 'quadratic_equality'
  | 'quadratic_inequality'
  | 'integer_constraint'
  | 'cardinality_constraint'
  | 'logical_constraint';

export type ConstraintPriority = 'hard' | 'soft' | 'preference' | 'goal';

export interface ObjectiveFunction {
  type: 'minimize' | 'maximize' | 'multi_objective';
  expression: string;
  weight: number;
  quantumSpeedupExpected: boolean;
  classicalBenchmark?: ClassicalBenchmark;
}

export interface ClassicalBenchmark {
  algorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  expectedRuntime: number;
  accuracy: number;
}

export type ProblemComplexity = 
  | 'polynomial'
  | 'np_complete'
  | 'np_hard'
  | 'pspace_complete'
  | 'exponential'
  | 'intractable';

export interface QuantumOptimizationResult {
  solutionId: string;
  timestamp: string;
  problem: OptimizationProblem;
  solution: OptimizationSolution;
  performance: QuantumPerformanceMetrics;
  quantumAdvantage: QuantumAdvantageAnalysis;
  confidence: ConfidenceMetrics;
  validation: SolutionValidation;
}

export interface OptimizationSolution {
  variableAssignments: VariableAssignment[];
  objectiveValue: number;
  feasible: boolean;
  optimal: boolean;
  solutionQuality: SolutionQuality;
  alternativeSolutions: AlternativeSolution[];
}

export interface VariableAssignment {
  variableName: string;
  value: any;
  confidence: number;
  quantumContribution: number;
}

export interface SolutionQuality {
  optimality: number;
  feasibility: number;
  robustness: number;
  sensitivity: SensitivityAnalysis;
}

export interface SensitivityAnalysis {
  parameterSensitivity: ParameterSensitivity[];
  constraintSensitivity: ConstraintSensitivity[];
  objectiveSensitivity: number;
}

export interface ParameterSensitivity {
  parameter: string;
  sensitivity: number;
  impactOnSolution: number;
  criticalThreshold: number;
}

export interface ConstraintSensitivity {
  constraintId: string;
  shadowPrice: number;
  rightHandSideRange: Range;
  bindingStatus: 'binding' | 'non_binding' | 'redundant';
}

export interface Range {
  min: number;
  max: number;
  current: number;
}

export interface AlternativeSolution {
  rank: number;
  objectiveValue: number;
  variableAssignments: VariableAssignment[];
  diversityScore: number;
  tradeoffAnalysis: TradeoffAnalysis;
}

export interface TradeoffAnalysis {
  objectiveTradeoffs: ObjectiveTradeoff[];
  constraintRelaxation: ConstraintRelaxation[];
  riskReturn: RiskReturnProfile;
}

export interface ObjectiveTradeoff {
  objective1: string;
  objective2: string;
  tradeoffRatio: number;
  paretoEfficient: boolean;
}

export interface ConstraintRelaxation {
  constraintId: string;
  relaxationAmount: number;
  impactOnObjective: number;
  feasibilityImpact: number;
}

export interface RiskReturnProfile {
  expectedReturn: number;
  risk: number;
  sharpeRatio: number;
  valueAtRisk: number;
}

export interface QuantumPerformanceMetrics {
  executionTime: ExecutionTimeMetrics;
  quantumResourceUsage: QuantumResourceUsage;
  speedupMetrics: SpeedupMetrics;
  accuracyMetrics: AccuracyMetrics;
  scalabilityMetrics: ScalabilityMetrics;
}

export interface ExecutionTimeMetrics {
  totalTime: number;
  quantumProcessingTime: number;
  classicalProcessingTime: number;
  communicationOverhead: number;
  optimizationTime: number;
}

export interface QuantumResourceUsage {
  qubitsUsed: number;
  quantumGates: number;
  circuitDepth: number;
  quantumVolume: number;
  coherenceTime: number;
  errorRate: number;
}

export interface SpeedupMetrics {
  quantumSpeedup: number;
  theoreticalSpeedup: number;
  practicalSpeedup: number;
  speedupVariance: number;
  scalingBehavior: SpeedupScaling;
}

export interface SpeedupScaling {
  problemSizeScaling: ScalingFunction;
  quantumResourceScaling: ScalingFunction;
  hybridScaling: ScalingFunction;
}

export interface ScalingFunction {
  function: string;
  parameters: number[];
  goodnessFit: number;
  confidenceInterval: Range;
}

export interface AccuracyMetrics {
  solutionAccuracy: number;
  quantumErrorRate: number;
  classicalErrorRate: number;
  hybridErrorRate: number;
  errorCorrection: ErrorCorrectionMetrics;
}

export interface ErrorCorrectionMetrics {
  logicalErrorRate: number;
  physicalErrorRate: number;
  correctionOverhead: number;
  thresholdAchieved: boolean;
}

export interface ScalabilityMetrics {
  maxProblemSize: number;
  resourceScaling: ResourceScaling;
  performanceScaling: PerformanceScaling;
  limitingFactors: LimitingFactor[];
}

export interface ResourceScaling {
  qubitScaling: ScalingFunction;
  timeScaling: ScalingFunction;
  memoryScaling: ScalingFunction;
}

export interface PerformanceScaling {
  speedupScaling: ScalingFunction;
  accuracyScaling: ScalingFunction;
  reliabilityScaling: ScalingFunction;
}

export interface LimitingFactor {
  factor: 'qubit_count' | 'coherence_time' | 'gate_fidelity' | 'connectivity' | 'classical_overhead';
  impact: number;
  mitigation: string;
}

export interface QuantumAdvantageAnalysis {
  advantageAchieved: boolean;
  advantageType: QuantumAdvantageType;
  advantageMagnitude: number;
  confidenceLevel: number;
  comparisonBenchmarks: BenchmarkComparison[];
  advantageStability: AdvantageStability;
}

export type QuantumAdvantageType = 
  | 'computational_speedup'
  | 'solution_quality'
  | 'resource_efficiency'
  | 'noise_resilience'
  | 'hybrid_advantage';

export interface BenchmarkComparison {
  algorithm: string;
  classicalTime: number;
  quantumTime: number;
  speedupRatio: number;
  qualityComparison: QualityComparison;
}

export interface QualityComparison {
  classicalQuality: number;
  quantumQuality: number;
  qualityImprovement: number;
  statisticalSignificance: number;
}

export interface AdvantageStability {
  stability: number;
  varianceAcrossRuns: number;
  robustnessToNoise: number;
  scalingStability: number;
}

export interface ConfidenceMetrics {
  overallConfidence: number;
  solutionConfidence: number;
  performanceConfidence: number;
  advantageConfidence: number;
  uncertaintyQuantification: UncertaintyQuantification;
}

export interface UncertaintyQuantification {
  epistemic: number;
  aleatory: number;
  model: number;
  measurement: number;
}

export interface SolutionValidation {
  validationMethod: ValidationMethod[];
  crossValidation: CrossValidationResult;
  robustnessTest: RobustnessTestResult;
  benchmarkValidation: BenchmarkValidationResult;
}

export interface ValidationMethod {
  method: 'analytical' | 'simulation' | 'empirical' | 'cross_validation' | 'bootstrap';
  confidence: number;
  result: 'valid' | 'invalid' | 'uncertain';
}

export interface CrossValidationResult {
  folds: number;
  averagePerformance: number;
  standardDeviation: number;
  consistency: number;
}

export interface RobustnessTestResult {
  parameterPerturbation: PerturbationTest[];
  noiseTolerance: NoiseToleranceTest;
  outlierResistance: OutlierResistanceTest;
}

export interface PerturbationTest {
  parameter: string;
  perturbationRange: Range;
  solutionStability: number;
  performanceImpact: number;
}

export interface NoiseToleranceTest {
  noiseLevel: number;
  performanceDegradation: number;
  errorThreshold: number;
  recoveryCapability: number;
}

export interface OutlierResistanceTest {
  outlierRatio: number;
  solutionRobustness: number;
  detectionCapability: number;
  mitigationEffectiveness: number;
}

export interface BenchmarkValidationResult {
  industryBenchmarks: IndustryBenchmark[];
  academicBenchmarks: AcademicBenchmark[];
  comparativePerformance: ComparativePerformance;
}

export interface IndustryBenchmark {
  benchmark: string;
  performance: number;
  ranking: number;
  industryStandard: boolean;
}

export interface AcademicBenchmark {
  benchmark: string;
  publication: string;
  performance: number;
  reproducibility: number;
}

export interface ComparativePerformance {
  relativePerformance: number;
  competitiveAdvantage: number;
  performanceGap: number;
  improvementPotential: number;
}

// Quantum-Classical ML Framework
export interface QuantumClassicalMLFramework {
  hybridModels: HybridMLModel[];
  quantumFeatureMap: QuantumFeatureMap;
  classicalOptimizer: ClassicalOptimizer;
  quantumVariationalCircuit: QuantumVariationalCircuit;
  performanceAnalytics: MLPerformanceAnalytics;
}

export interface HybridMLModel {
  modelId: string;
  type: HybridModelType;
  quantumLayers: QuantumLayer[];
  classicalLayers: ClassicalLayer[];
  trainingStrategy: TrainingStrategy;
  performance: ModelPerformance;
}

export type HybridModelType = 
  | 'quantum_neural_network'
  | 'variational_classifier'
  | 'quantum_convolutional'
  | 'quantum_recurrent'
  | 'quantum_transformer'
  | 'quantum_gnn';

export interface QuantumLayer {
  layerId: string;
  type: QuantumLayerType;
  qubits: number;
  parameters: QuantumParameter[];
  circuit: QuantumCircuit;
  entanglement: EntanglementPattern;
}

export type QuantumLayerType = 
  | 'parameterized_circuit'
  | 'quantum_convolution'
  | 'quantum_pooling'
  | 'quantum_attention'
  | 'quantum_embedding';

export interface QuantumParameter {
  name: string;
  value: number;
  gradient: number;
  learningRate: number;
  regularization: number;
}

export interface QuantumCircuit {
  circuitId: string;
  gates: QuantumGate[];
  depth: number;
  width: number;
  fidelity: number;
}

export interface QuantumGate {
  type: QuantumGateType;
  qubits: number[];
  parameters: number[];
  duration: number;
  errorRate: number;
}

export type QuantumGateType = 
  | 'hadamard'
  | 'pauli_x'
  | 'pauli_y'
  | 'pauli_z'
  | 'rotation_x'
  | 'rotation_y'
  | 'rotation_z'
  | 'cnot'
  | 'controlled_z'
  | 'toffoli'
  | 'phase'
  | 'swap'
  | 'fredkin';

export interface EntanglementPattern {
  type: EntanglementType;
  connectivity: ConnectivityGraph;
  depth: number;
  strength: number;
}

export type EntanglementType = 
  | 'linear'
  | 'circular'
  | 'star'
  | 'complete'
  | 'random'
  | 'hardware_native';

export interface ConnectivityGraph {
  nodes: number[];
  edges: GraphEdge[];
  connectivity: number;
  diameter: number;
}

export interface GraphEdge {
  source: number;
  target: number;
  weight: number;
  fidelity: number;
}

export interface ClassicalLayer {
  layerId: string;
  type: ClassicalLayerType;
  neurons: number;
  activation: ActivationFunction;
  parameters: ClassicalParameter[];
}

export type ClassicalLayerType = 
  | 'dense'
  | 'convolutional'
  | 'recurrent'
  | 'attention'
  | 'normalization'
  | 'dropout';

export interface ClassicalParameter {
  name: string;
  shape: number[];
  value: number[];
  gradient: number[];
  optimizer: OptimizerState;
}

export interface OptimizerState {
  type: 'adam' | 'sgd' | 'rmsprop' | 'adagrad';
  learningRate: number;
  momentum: number;
  beta1?: number;
  beta2?: number;
  epsilon?: number;
}

export interface ActivationFunction {
  type: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'gelu' | 'swish';
  parameters: number[];
}

export interface TrainingStrategy {
  type: TrainingStrategyType;
  epochs: number;
  batchSize: number;
  optimizationSchedule: OptimizationSchedule;
  regularization: RegularizationConfig;
  validation: ValidationConfig;
}

export type TrainingStrategyType = 
  | 'end_to_end'
  | 'alternating'
  | 'staged'
  | 'transfer_learning'
  | 'meta_learning';

export interface OptimizationSchedule {
  quantumSteps: number;
  classicalSteps: number;
  schedulingStrategy: 'fixed' | 'adaptive' | 'dynamic';
  convergenceCriteria: ConvergenceCriteria;
}

export interface ConvergenceCriteria {
  lossTolerance: number;
  gradientTolerance: number;
  maxIterations: number;
  plateauPatience: number;
}

export interface RegularizationConfig {
  l1Regularization: number;
  l2Regularization: number;
  dropout: number;
  quantumNoise: QuantumNoiseConfig;
}

export interface QuantumNoiseConfig {
  depolarizing: number;
  amplitude_damping: number;
  phase_damping: number;
  thermal: number;
}

export interface ValidationConfig {
  strategy: 'holdout' | 'k_fold' | 'time_series' | 'stratified';
  splitRatio: number;
  folds?: number;
  shuffling: boolean;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  quantumContribution: QuantumContribution;
  trainingMetrics: TrainingMetrics;
}

export interface QuantumContribution {
  informationGain: number;
  expressivity: number;
  generalization: number;
  noiseResilience: number;
}

export interface TrainingMetrics {
  convergenceTime: number;
  finalLoss: number;
  gradientNorm: number;
  parameterUpdates: number;
  quantumCircuitCalls: number;
}

export interface QuantumFeatureMap {
  encoding: FeatureEncodingType;
  dimension: number;
  entanglement: EntanglementPattern;
  repetitions: number;
  dataReuploading: boolean;
}

export type FeatureEncodingType = 
  | 'amplitude_encoding'
  | 'angle_encoding'
  | 'basis_encoding'
  | 'dense_angle_encoding'
  | 'iqp_encoding';

export interface ClassicalOptimizer {
  type: 'adam' | 'lbfgs' | 'cobyla' | 'spsa' | 'nesterov';
  hyperparameters: OptimizerHyperparameters;
  adaptiveScheduling: boolean;
  convergenceMonitoring: ConvergenceMonitoring;
}

export interface OptimizerHyperparameters {
  learningRate: number;
  momentum?: number;
  beta1?: number;
  beta2?: number;
  epsilon?: number;
  weightDecay?: number;
}

export interface ConvergenceMonitoring {
  patience: number;
  toleranceThreshold: number;
  improvementThreshold: number;
  earlyStoppingEnabled: boolean;
}

export interface QuantumVariationalCircuit {
  layers: VariationalLayer[];
  parameterCount: number;
  circuitDepth: number;
  expressivity: ExpressivityMetrics;
  trainability: TrainabilityMetrics;
}

export interface VariationalLayer {
  layerType: 'rotation' | 'entangling' | 'data_encoding' | 'measurement';
  qubits: number[];
  parameters: VariationalParameter[];
  gates: QuantumGate[];
}

export interface VariationalParameter {
  parameterId: string;
  initialValue: number;
  bounds: Range;
  learningRate: number;
  gradientClipping: number;
}

export interface ExpressivityMetrics {
  meyer_wallach_measure: number;
  expressivity_index: number;
  state_space_coverage: number;
  entangling_capability: number;
}

export interface TrainabilityMetrics {
  gradient_variance: number;
  barren_plateau_indicator: number;
  optimization_landscape_ruggedness: number;
  convergence_rate: number;
}

export interface MLPerformanceAnalytics {
  modelComparison: ModelComparison[];
  quantumAdvantageAnalysis: MLQuantumAdvantage;
  scalabilityAnalysis: MLScalabilityAnalysis;
  robustnessAnalysis: MLRobustnessAnalysis;
}

export interface ModelComparison {
  modelName: string;
  performance: ModelPerformance;
  resourceUsage: ResourceUsage;
  trainingTime: number;
  inferenceTime: number;
}

export interface ResourceUsage {
  quantumResources: QuantumResourceUsage;
  classicalResources: ClassicalResourceUsage;
  hybridEfficiency: number;
}

export interface ClassicalResourceUsage {
  cpuTime: number;
  memoryUsage: number;
  gpuTime?: number;
  diskIO: number;
}

export interface MLQuantumAdvantage {
  learningAdvantage: number;
  generalizationAdvantage: number;
  expressivityAdvantage: number;
  noiseAdvantage: number;
  advantageConditions: AdvantageCondition[];
}

export interface AdvantageCondition {
  condition: string;
  threshold: number;
  currentValue: number;
  satisfied: boolean;
}

export interface MLScalabilityAnalysis {
  dataScaling: DataScalingAnalysis;
  modelScaling: ModelScalingAnalysis;
  hardwareScaling: HardwareScalingAnalysis;
}

export interface DataScalingAnalysis {
  dataSizeImpact: ScalingFunction;
  dimensionalityImpact: ScalingFunction;
  noiseImpact: ScalingFunction;
}

export interface ModelScalingAnalysis {
  parameterScaling: ScalingFunction;
  depthScaling: ScalingFunction;
  widthScaling: ScalingFunction;
}

export interface HardwareScalingAnalysis {
  qubitScaling: ScalingFunction;
  connectivityScaling: ScalingFunction;
  fidelityRequirements: FidelityRequirement[];
}

export interface FidelityRequirement {
  operation: string;
  requiredFidelity: number;
  currentFidelity: number;
  gap: number;
}

export interface MLRobustnessAnalysis {
  adversarialRobustness: AdversarialRobustness;
  quantumNoiseRobustness: QuantumNoiseRobustness;
  distributionShiftRobustness: DistributionShiftRobustness;
}

export interface AdversarialRobustness {
  attackTypes: AdversarialAttack[];
  defenseStrategies: DefenseStrategy[];
  robustnessScore: number;
}

export interface AdversarialAttack {
  attackType: string;
  successRate: number;
  perturbationMagnitude: number;
  transferability: number;
}

export interface DefenseStrategy {
  strategy: string;
  effectiveness: number;
  overhead: number;
  quantumSpecific: boolean;
}

export interface QuantumNoiseRobustness {
  noiseTypes: NoiseType[];
  mitigationStrategies: MitigationStrategy[];
  performanceDegradation: PerformanceDegradation;
}

export interface NoiseType {
  type: string;
  impact: number;
  frequency: number;
  mitigation: string;
}

export interface MitigationStrategy {
  strategy: string;
  effectiveness: number;
  cost: number;
  applicability: string[];
}

export interface PerformanceDegradation {
  noiseLevel: number;
  accuracyLoss: number;
  confidenceLoss: number;
  stabilityLoss: number;
}

export interface DistributionShiftRobustness {
  shiftTypes: DistributionShift[];
  adaptationStrategies: AdaptationStrategy[];
  generalizationMetrics: GeneralizationMetrics;
}

export interface DistributionShift {
  shiftType: string;
  magnitude: number;
  detection: ShiftDetection;
  impact: ShiftImpact;
}

export interface ShiftDetection {
  detectionMethod: string;
  sensitivity: number;
  falsePositiveRate: number;
  detectionLatency: number;
}

export interface ShiftImpact {
  performanceImpact: number;
  confidenceImpact: number;
  calibrationImpact: number;
  recoveryTime: number;
}

export interface AdaptationStrategy {
  strategy: string;
  effectiveness: number;
  adaptationTime: number;
  resourceRequirements: number;
}

export interface GeneralizationMetrics {
  outOfDistributionPerformance: number;
  domainTransferability: number;
  fewShotAdaptation: number;
  continuousLearning: number;
}

// Post-Quantum Cryptography
export interface PostQuantumCryptography {
  encryptionAlgorithms: PQCAlgorithm[];
  keyExchange: PQCKeyExchange;
  digitalSignatures: PQCDigitalSignature;
  securityAnalysis: PQCSecurityAnalysis;
}

export interface PQCAlgorithm {
  name: string;
  type: PQCAlgorithmType;
  securityLevel: SecurityLevel;
  keySize: KeySize;
  performance: CryptographicPerformance;
  quantumResistance: QuantumResistanceLevel;
}

export type PQCAlgorithmType = 
  | 'lattice_based'
  | 'code_based'
  | 'multivariate'
  | 'hash_based'
  | 'isogeny_based'
  | 'symmetric_key';

export interface SecurityLevel {
  bits: number;
  nistLevel: 1 | 2 | 3 | 4 | 5;
  quantumSecure: boolean;
  classicalSecure: boolean;
}

export interface KeySize {
  publicKey: number;
  privateKey: number;
  signature?: number;
  ciphertext?: number;
}

export interface CryptographicPerformance {
  keyGeneration: PerformanceMetric;
  encryption: PerformanceMetric;
  decryption: PerformanceMetric;
  signing?: PerformanceMetric;
  verification?: PerformanceMetric;
}

export interface PerformanceMetric {
  timeMs: number;
  cpuCycles: number;
  memoryKB: number;
  bandwidth: number;
}

export type QuantumResistanceLevel = 
  | 'quantum_vulnerable'
  | 'quantum_resistant'
  | 'quantum_secure'
  | 'quantum_proof';

export interface PQCKeyExchange {
  algorithms: KeyExchangeAlgorithm[];
  hybridModes: HybridKeyExchange[];
  securityProperties: KeyExchangeSecurity;
}

export interface KeyExchangeAlgorithm {
  name: string;
  type: 'kyber' | 'ntru' | 'saber' | 'frodo' | 'sike';
  keySize: KeySize;
  performance: CryptographicPerformance;
  standardization: StandardizationStatus;
}

export interface StandardizationStatus {
  nistStatus: 'candidate' | 'finalist' | 'winner' | 'standardized';
  isoStatus: 'draft' | 'published' | 'withdrawn';
  industryAdoption: AdoptionLevel;
}

export type AdoptionLevel = 'experimental' | 'limited' | 'widespread' | 'universal';

export interface HybridKeyExchange {
  classical: string;
  postQuantum: string;
  combinerFunction: string;
  securityAssurance: SecurityAssurance;
}

export interface SecurityAssurance {
  quantumSecurity: boolean;
  classicalSecurity: boolean;
  transitionalSecurity: boolean;
  performanceOverhead: number;
}

export interface KeyExchangeSecurity {
  forwardSecrecy: boolean;
  postCompromiseSecurity: boolean;
  keyConfirmation: boolean;
  authenticationMethod: AuthenticationMethod;
}

export interface AuthenticationMethod {
  type: 'certificate' | 'preshared_key' | 'password' | 'biometric';
  strength: SecurityLevel;
  quantumResistant: boolean;
}

export interface PQCDigitalSignature {
  algorithms: DigitalSignatureAlgorithm[];
  aggregationSchemes: SignatureAggregation[];
  multisignatureSchemes: MultisignatureScheme[];
}

export interface DigitalSignatureAlgorithm {
  name: string;
  type: 'dilithium' | 'falcon' | 'sphincs' | 'picnic' | 'rainbow';
  keySize: KeySize;
  performance: CryptographicPerformance;
