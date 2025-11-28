/**
 * Strategy Module
 *
 * Exports Blue Ocean Engine and Strategy Generator for multi-path decision making.
 */

export {
  BlueOceanEngine,
  type BlueOceanInput,
  type BlueOceanOutput,
  type BlueOceanOpportunity,
  type StrategicCanvas,
} from './blueOceanEngine';

export {
  StrategyGenerator,
  type ExplanationMode,
  type StrategyContext,
  type StrategyOption,
  type BlueOceanOption,
  type StrategyChoices,
} from './strategyGenerator';
