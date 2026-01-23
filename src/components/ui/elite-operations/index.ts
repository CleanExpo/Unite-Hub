/**
 * Elite Operations System
 *
 * Premium AI operation progress visualization for Unite-Hub.
 * Shows users exactly what the system is doing in real-time.
 *
 * Components:
 * - EliteOperationStatus: Main status display component
 * - EliteOperationsProvider: Global context for managing operations
 * - EliteOperationDemo: Interactive demo for showcasing
 *
 * Hooks:
 * - useOperationStatus: Local state management for single operation
 * - useEliteOperations: Global operations context hook
 *
 * @example
 * // Wrap your app with the provider
 * <EliteOperationsProvider>
 *   <App />
 * </EliteOperationsProvider>
 *
 * // In any component, start an operation
 * const { startOperation, setPhase, setProgress, completeOperation } = useEliteOperations();
 *
 * async function handleAITask() {
 *   startOperation('my-task', 'Processing Request');
 *   setPhase('my-task', 'analyzing');
 *   setProgress('my-task', 25);
 *   // ... do work
 *   completeOperation('my-task');
 * }
 */

// Main status component
export {
  EliteOperationStatus,
  useOperationStatus,
  type OperationPhase,
  type OperationStep,
  type EliteOperationStatusProps,
  type UseOperationStatusOptions,
} from "../elite-operation-status";

// Global provider
export {
  EliteOperationsProvider,
  useEliteOperations,
  type Operation,
} from "../elite-operations-provider";

// Demo components
export {
  EliteOperationDemo,
  EliteOperationDemoGrid,
} from "../elite-operation-demo";
