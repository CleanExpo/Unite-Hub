/**
 * Campaign Builder Nodes
 *
 * Export all custom node components for ReactFlow
 *
 * @module components/campaigns/builder/nodes
 */

export { TriggerNode } from './TriggerNode';
export { EmailNode } from './EmailNode';
export { WaitNode } from './WaitNode';
export { ConditionNode } from './ConditionNode';
export { SplitNode } from './SplitNode';
export { ActionNode } from './ActionNode';
export { ExitNode } from './ExitNode';

// Node types mapping for ReactFlow
export const nodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  split: SplitNode,
  action: ActionNode,
  exit: ExitNode,
};
