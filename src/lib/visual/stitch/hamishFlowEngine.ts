/**
 * Hamish Flow Engine
 * Phase 68: Creative flow orchestration with brand-aware composition
 */

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  config: NodeConfig;
  inputs: string[];
  outputs: string[];
  position: { x: number; y: number };
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export type FlowNodeType =
  | 'input'
  | 'generate'
  | 'transform'
  | 'composite'
  | 'filter'
  | 'output'
  | 'branch'
  | 'loop'
  | 'merge';

export interface NodeConfig {
  label: string;
  params: Record<string, unknown>;
  provider?: string;
  method_id?: string;
  condition?: string;
  iterations?: number;
}

export interface FlowConnection {
  id: string;
  from_node: string;
  from_output: string;
  to_node: string;
  to_input: string;
  data_type: 'image' | 'text' | 'json' | 'any';
}

export interface HamishFlow {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  variables: FlowVariable[];
  brand_context?: BrandFlowContext;
  created_at: Date;
  updated_at: Date;
}

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'file';
  value: unknown;
  exposed: boolean;
}

export interface BrandFlowContext {
  brand_id: string;
  colors: { primary: string; secondary: string; accent: string };
  fonts: { heading: string; body: string };
  logo_url: string;
  voice: string;
  guidelines: string[];
}

export interface FlowExecution {
  id: string;
  flow_id: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  current_node?: string;
  node_results: Map<string, NodeResult>;
  started_at: Date;
  completed_at?: Date;
  error?: string;
}

export interface NodeResult {
  node_id: string;
  outputs: Record<string, unknown>;
  execution_time_ms: number;
  cost: number;
}

export interface FlowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: Partial<FlowNode>[];
  connections: Partial<FlowConnection>[];
  variables: FlowVariable[];
}

// Flow templates
const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'social_campaign_flow',
    name: 'Social Campaign Flow',
    category: 'campaigns',
    description: 'Generate consistent social media assets across platforms',
    nodes: [
      { id: 'input_1', type: 'input', config: { label: 'Campaign Brief' } },
      { id: 'gen_1', type: 'generate', config: { label: 'Hero Image', method_id: 'hero_section_generator' } },
      { id: 'branch_1', type: 'branch', config: { label: 'Platform Split' } },
      { id: 'transform_fb', type: 'transform', config: { label: 'Facebook Format' } },
      { id: 'transform_ig', type: 'transform', config: { label: 'Instagram Format' } },
      { id: 'transform_li', type: 'transform', config: { label: 'LinkedIn Format' } },
      { id: 'merge_1', type: 'merge', config: { label: 'Collect Assets' } },
      { id: 'output_1', type: 'output', config: { label: 'Campaign Assets' } },
    ],
    connections: [
      { from_node: 'input_1', to_node: 'gen_1', data_type: 'any' },
      { from_node: 'gen_1', to_node: 'branch_1', data_type: 'image' },
      { from_node: 'branch_1', to_node: 'transform_fb', data_type: 'image' },
      { from_node: 'branch_1', to_node: 'transform_ig', data_type: 'image' },
      { from_node: 'branch_1', to_node: 'transform_li', data_type: 'image' },
      { from_node: 'transform_fb', to_node: 'merge_1', data_type: 'image' },
      { from_node: 'transform_ig', to_node: 'merge_1', data_type: 'image' },
      { from_node: 'transform_li', to_node: 'merge_1', data_type: 'image' },
      { from_node: 'merge_1', to_node: 'output_1', data_type: 'any' },
    ],
    variables: [
      { name: 'headline', type: 'string', value: '', exposed: true },
      { name: 'brand_color', type: 'color', value: '#000000', exposed: true },
    ],
  },
  {
    id: 'brand_asset_flow',
    name: 'Brand Asset Generation',
    category: 'brand',
    description: 'Generate complete brand asset set from brief',
    nodes: [
      { id: 'input_1', type: 'input', config: { label: 'Brand Brief' } },
      { id: 'gen_logo', type: 'generate', config: { label: 'Logo Concepts', method_id: 'logo_concept_generator' } },
      { id: 'gen_palette', type: 'generate', config: { label: 'Color Palette', method_id: 'color_palette_extractor' } },
      { id: 'gen_pattern', type: 'generate', config: { label: 'Brand Pattern', method_id: 'brand_pattern_creator' } },
      { id: 'composite_1', type: 'composite', config: { label: 'Brand Board' } },
      { id: 'output_1', type: 'output', config: { label: 'Brand Assets' } },
    ],
    connections: [
      { from_node: 'input_1', to_node: 'gen_logo', data_type: 'any' },
      { from_node: 'gen_logo', to_node: 'gen_palette', data_type: 'image' },
      { from_node: 'gen_palette', to_node: 'gen_pattern', data_type: 'json' },
      { from_node: 'gen_logo', to_node: 'composite_1', data_type: 'image' },
      { from_node: 'gen_palette', to_node: 'composite_1', data_type: 'json' },
      { from_node: 'gen_pattern', to_node: 'composite_1', data_type: 'image' },
      { from_node: 'composite_1', to_node: 'output_1', data_type: 'any' },
    ],
    variables: [
      { name: 'brand_name', type: 'string', value: '', exposed: true },
      { name: 'industry', type: 'string', value: '', exposed: true },
    ],
  },
  {
    id: 'iteration_refine_flow',
    name: 'Iterative Refinement',
    category: 'evolution',
    description: 'Generate and refine visuals through feedback loop',
    nodes: [
      { id: 'input_1', type: 'input', config: { label: 'Initial Prompt' } },
      { id: 'gen_1', type: 'generate', config: { label: 'Generate Visual' } },
      { id: 'loop_1', type: 'loop', config: { label: 'Refinement Loop', iterations: 3 } },
      { id: 'filter_1', type: 'filter', config: { label: 'Quality Check' } },
      { id: 'transform_1', type: 'transform', config: { label: 'Apply Feedback' } },
      { id: 'output_1', type: 'output', config: { label: 'Refined Output' } },
    ],
    connections: [
      { from_node: 'input_1', to_node: 'gen_1', data_type: 'any' },
      { from_node: 'gen_1', to_node: 'loop_1', data_type: 'image' },
      { from_node: 'loop_1', to_node: 'filter_1', data_type: 'image' },
      { from_node: 'filter_1', to_node: 'transform_1', data_type: 'image' },
      { from_node: 'transform_1', to_node: 'loop_1', data_type: 'image' },
      { from_node: 'loop_1', to_node: 'output_1', data_type: 'image' },
    ],
    variables: [
      { name: 'quality_threshold', type: 'number', value: 80, exposed: true },
    ],
  },
];

export class HamishFlowEngine {
  private flows: Map<string, HamishFlow> = new Map();
  private executions: Map<string, FlowExecution> = new Map();

  /**
   * Create new flow
   */
  createFlow(name: string, description: string, workspaceId: string): HamishFlow {
    const flow: HamishFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      workspace_id: workspaceId,
      nodes: [],
      connections: [],
      variables: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.flows.set(flow.id, flow);
    return flow;
  }

  /**
   * Create flow from template
   */
  createFromTemplate(templateId: string, name: string, workspaceId: string): HamishFlow {
    const template = FLOW_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const flow = this.createFlow(name, template.description, workspaceId);

    // Add nodes
    let yPos = 100;
    for (const nodeTemplate of template.nodes) {
      const node = this.addNode(flow.id, nodeTemplate.type || 'generate', {
        ...nodeTemplate.config,
      });
      node.position = { x: 200, y: yPos };
      yPos += 150;
    }

    // Add connections
    for (const connTemplate of template.connections) {
      const fromNode = flow.nodes.find(n => n.config.label === template.nodes.find(t => t.id === connTemplate.from_node)?.config?.label);
      const toNode = flow.nodes.find(n => n.config.label === template.nodes.find(t => t.id === connTemplate.to_node)?.config?.label);

      if (fromNode && toNode) {
        this.addConnection(flow.id, fromNode.id, 'output', toNode.id, 'input', connTemplate.data_type || 'any');
      }
    }

    // Add variables
    flow.variables = [...template.variables];

    return flow;
  }

  /**
   * Add node to flow
   */
  addNode(flowId: string, type: FlowNodeType, config: Partial<NodeConfig>): FlowNode {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    const node: FlowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      config: {
        label: config.label || `${type} Node`,
        params: config.params || {},
        provider: config.provider,
        method_id: config.method_id,
        condition: config.condition,
        iterations: config.iterations,
      },
      inputs: type === 'input' ? [] : ['input'],
      outputs: type === 'output' ? [] : ['output'],
      position: { x: 0, y: 0 },
      status: 'idle',
    };

    flow.nodes.push(node);
    flow.updated_at = new Date();

    return node;
  }

  /**
   * Add connection between nodes
   */
  addConnection(
    flowId: string,
    fromNode: string,
    fromOutput: string,
    toNode: string,
    toInput: string,
    dataType: FlowConnection['data_type'] = 'any'
  ): FlowConnection {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    const connection: FlowConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from_node: fromNode,
      from_output: fromOutput,
      to_node: toNode,
      to_input: toInput,
      data_type: dataType,
    };

    flow.connections.push(connection);
    flow.updated_at = new Date();

    return connection;
  }

  /**
   * Set brand context for flow
   */
  setBrandContext(flowId: string, context: BrandFlowContext): void {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    flow.brand_context = context;
    flow.updated_at = new Date();
  }

  /**
   * Execute flow
   */
  async execute(flowId: string, inputs: Record<string, unknown>): Promise<FlowExecution> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    const execution: FlowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      flow_id: flowId,
      status: 'running',
      node_results: new Map(),
      started_at: new Date(),
    };

    this.executions.set(execution.id, execution);

    try {
      // Find input nodes and set their values
      const inputNodes = flow.nodes.filter(n => n.type === 'input');
      for (const node of inputNodes) {
        execution.node_results.set(node.id, {
          node_id: node.id,
          outputs: { output: inputs[node.config.label] || inputs['default'] },
          execution_time_ms: 0,
          cost: 0,
        });
        node.status = 'completed';
      }

      // Topological execution
      await this.executeNodes(flow, execution);

      execution.status = 'completed';
      execution.completed_at = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completed_at = new Date();
    }

    return execution;
  }

  /**
   * Execute nodes in topological order
   */
  private async executeNodes(flow: HamishFlow, execution: FlowExecution): Promise<void> {
    const executed = new Set<string>();
    const pending = flow.nodes.filter(n => n.type !== 'input');

    while (pending.length > 0) {
      // Find nodes whose dependencies are satisfied
      const ready = pending.filter(node => {
        const incomingConnections = flow.connections.filter(c => c.to_node === node.id);
        return incomingConnections.every(c => executed.has(c.from_node));
      });

      if (ready.length === 0) {
        throw new Error('Circular dependency detected in flow');
      }

      // Execute ready nodes
      for (const node of ready) {
        execution.current_node = node.id;
        node.status = 'processing';

        const result = await this.executeNode(node, flow, execution);
        execution.node_results.set(node.id, result);

        node.status = 'completed';
        executed.add(node.id);

        // Remove from pending
        const index = pending.indexOf(node);
        pending.splice(index, 1);
      }
    }
  }

  /**
   * Execute single node
   */
  private async executeNode(
    node: FlowNode,
    flow: HamishFlow,
    execution: FlowExecution
  ): Promise<NodeResult> {
    const startTime = Date.now();

    // Gather inputs from connected nodes
    const inputs: Record<string, unknown> = {};
    const incomingConnections = flow.connections.filter(c => c.to_node === node.id);

    for (const conn of incomingConnections) {
      const sourceResult = execution.node_results.get(conn.from_node);
      if (sourceResult) {
        inputs[conn.to_input] = sourceResult.outputs[conn.from_output];
      }
    }

    // Apply brand context if available
    if (flow.brand_context) {
      inputs['brand_context'] = flow.brand_context;
    }

    // Execute based on node type
    let outputs: Record<string, unknown> = {};
    let cost = 0;

    switch (node.type) {
      case 'generate':
        // Mock generation
        outputs = { output: `generated_${node.id}` };
        cost = 0.05;
        break;

      case 'transform':
        outputs = { output: `transformed_${inputs.input}` };
        cost = 0.01;
        break;

      case 'composite':
        outputs = { output: `composite_${node.id}` };
        cost = 0.02;
        break;

      case 'filter':
        outputs = { output: inputs.input, passed: true };
        cost = 0;
        break;

      case 'branch':
        // Copy input to all outputs
        outputs = { output: inputs.input };
        cost = 0;
        break;

      case 'merge':
        // Collect all inputs
        outputs = { output: Object.values(inputs) };
        cost = 0;
        break;

      case 'loop':
        // Execute iterations
        outputs = { output: inputs.input };
        cost = 0.03 * (node.config.iterations || 1);
        break;

      case 'output':
        outputs = inputs;
        cost = 0;
        break;

      default:
        outputs = inputs;
    }

    return {
      node_id: node.id,
      outputs,
      execution_time_ms: Date.now() - startTime,
      cost,
    };
  }

  /**
   * Get flow
   */
  getFlow(flowId: string): HamishFlow | undefined {
    return this.flows.get(flowId);
  }

  /**
   * Get execution
   */
  getExecution(executionId: string): FlowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get available templates
   */
  getTemplates(category?: string): FlowTemplate[] {
    if (category) {
      return FLOW_TEMPLATES.filter(t => t.category === category);
    }
    return FLOW_TEMPLATES;
  }

  /**
   * Validate flow
   */
  validateFlow(flowId: string): { valid: boolean; errors: string[] } {
    const flow = this.flows.get(flowId);
    if (!flow) {
      return { valid: false, errors: ['Flow not found'] };
    }

    const errors: string[] = [];

    // Check for input nodes
    if (!flow.nodes.some(n => n.type === 'input')) {
      errors.push('Flow must have at least one input node');
    }

    // Check for output nodes
    if (!flow.nodes.some(n => n.type === 'output')) {
      errors.push('Flow must have at least one output node');
    }

    // Check for disconnected nodes
    for (const node of flow.nodes) {
      if (node.type !== 'input') {
        const hasInput = flow.connections.some(c => c.to_node === node.id);
        if (!hasInput) {
          errors.push(`Node "${node.config.label}" has no inputs`);
        }
      }

      if (node.type !== 'output') {
        const hasOutput = flow.connections.some(c => c.from_node === node.id);
        if (!hasOutput) {
          errors.push(`Node "${node.config.label}" has no outputs`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export default HamishFlowEngine;
