/**
 * Evolution Pipeline
 * Phase 68: Iterative visual refinement through feedback loops
 */

import { VisualMethod, getMethodById } from '../methods';

export interface EvolutionGenome {
  id: string;
  generation: number;
  params: Record<string, unknown>;
  fitness_score: number;
  parent_ids: string[];
  mutations: Mutation[];
  created_at: Date;
}

export interface Mutation {
  parameter: string;
  from_value: unknown;
  to_value: unknown;
  mutation_type: 'random' | 'crossover' | 'guided' | 'feedback';
}

export interface EvolutionSession {
  id: string;
  method_id: string;
  workspace_id: string;
  client_id?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  config: EvolutionConfig;
  generations: EvolutionGeneration[];
  best_genome: EvolutionGenome | null;
  total_genomes: number;
  created_at: Date;
  updated_at: Date;
}

export interface EvolutionGeneration {
  generation_number: number;
  genomes: EvolutionGenome[];
  avg_fitness: number;
  best_fitness: number;
  diversity_score: number;
  completed_at: Date;
}

export interface EvolutionConfig {
  population_size: number;
  max_generations: number;
  mutation_rate: number;
  crossover_rate: number;
  elite_count: number;
  fitness_threshold: number;
  diversity_pressure: number;
}

export interface FeedbackInput {
  genome_id: string;
  rating: number; // 1-5
  comments?: string;
  tags?: string[];
  preferred_aspects?: string[];
  disliked_aspects?: string[];
}

const DEFAULT_CONFIG: EvolutionConfig = {
  population_size: 8,
  max_generations: 10,
  mutation_rate: 0.2,
  crossover_rate: 0.7,
  elite_count: 2,
  fitness_threshold: 90,
  diversity_pressure: 0.3,
};

export class EvolutionPipeline {
  private sessions: Map<string, EvolutionSession> = new Map();

  /**
   * Start evolution session
   */
  startSession(
    methodId: string,
    initialParams: Record<string, unknown>,
    workspaceId: string,
    clientId?: string,
    config: Partial<EvolutionConfig> = {}
  ): EvolutionSession {
    const method = getMethodById(methodId);
    if (!method) {
      throw new Error(`Method not found: ${methodId}`);
    }

    const session: EvolutionSession = {
      id: `evo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method_id: methodId,
      workspace_id: workspaceId,
      client_id: clientId,
      status: 'active',
      config: { ...DEFAULT_CONFIG, ...config },
      generations: [],
      best_genome: null,
      total_genomes: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Create initial population
    const initialGeneration = this.createInitialGeneration(initialParams, session.config, method);
    session.generations.push(initialGeneration);
    session.total_genomes = initialGeneration.genomes.length;

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Create initial generation with random variations
   */
  private createInitialGeneration(
    baseParams: Record<string, unknown>,
    config: EvolutionConfig,
    method: VisualMethod
  ): EvolutionGeneration {
    const genomes: EvolutionGenome[] = [];

    for (let i = 0; i < config.population_size; i++) {
      const mutatedParams = i === 0 ? baseParams : this.mutateParams(baseParams, method, config.mutation_rate);

      genomes.push({
        id: `genome_0_${i}`,
        generation: 0,
        params: mutatedParams,
        fitness_score: 50, // Initial score, will be updated with feedback
        parent_ids: [],
        mutations: i === 0 ? [] : this.recordMutations(baseParams, mutatedParams),
        created_at: new Date(),
      });
    }

    return {
      generation_number: 0,
      genomes,
      avg_fitness: 50,
      best_fitness: 50,
      diversity_score: this.calculateDiversity(genomes),
      completed_at: new Date(),
    };
  }

  /**
   * Mutate parameters for variation
   */
  private mutateParams(
    params: Record<string, unknown>,
    method: VisualMethod,
    mutationRate: number
  ): Record<string, unknown> {
    const mutated = { ...params };

    for (const paramDef of method.params) {
      if (Math.random() < mutationRate) {
        mutated[paramDef.name] = this.mutateValue(params[paramDef.name], paramDef);
      }
    }

    return mutated;
  }

  /**
   * Mutate a single value
   */
  private mutateValue(value: unknown, paramDef: { type: string; options?: string[] }): unknown {
    switch (paramDef.type) {
      case 'select':
        if (paramDef.options && paramDef.options.length > 0) {
          return paramDef.options[Math.floor(Math.random() * paramDef.options.length)];
        }
        return value;

      case 'number':
        const num = value as number || 50;
        const delta = num * 0.2 * (Math.random() - 0.5) * 2;
        return Math.round(num + delta);

      case 'color':
        return this.mutateColor(value as string);

      default:
        return value;
    }
  }

  /**
   * Mutate a color value
   */
  private mutateColor(color: string): string {
    // Simple hue shift
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Record mutations between two parameter sets
   */
  private recordMutations(
    original: Record<string, unknown>,
    mutated: Record<string, unknown>
  ): Mutation[] {
    const mutations: Mutation[] = [];

    for (const key of Object.keys(mutated)) {
      if (JSON.stringify(original[key]) !== JSON.stringify(mutated[key])) {
        mutations.push({
          parameter: key,
          from_value: original[key],
          to_value: mutated[key],
          mutation_type: 'random',
        });
      }
    }

    return mutations;
  }

  /**
   * Calculate diversity score
   */
  private calculateDiversity(genomes: EvolutionGenome[]): number {
    if (genomes.length < 2) {
return 100;
}

    let differences = 0;
    let comparisons = 0;

    for (let i = 0; i < genomes.length; i++) {
      for (let j = i + 1; j < genomes.length; j++) {
        differences += this.countDifferences(genomes[i].params, genomes[j].params);
        comparisons++;
      }
    }

    return Math.min(100, (differences / comparisons) * 20);
  }

  /**
   * Count parameter differences
   */
  private countDifferences(a: Record<string, unknown>, b: Record<string, unknown>): number {
    let count = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const key of keys) {
      if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        count++;
      }
    }

    return count;
  }

  /**
   * Submit feedback for genomes
   */
  submitFeedback(sessionId: string, feedback: FeedbackInput[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update fitness scores based on feedback
    const currentGen = session.generations[session.generations.length - 1];

    for (const fb of feedback) {
      const genome = currentGen.genomes.find(g => g.id === fb.genome_id);
      if (genome) {
        // Convert 1-5 rating to 0-100 fitness
        genome.fitness_score = fb.rating * 20;
      }
    }

    // Update generation stats
    const scores = currentGen.genomes.map(g => g.fitness_score);
    currentGen.avg_fitness = scores.reduce((a, b) => a + b, 0) / scores.length;
    currentGen.best_fitness = Math.max(...scores);

    // Update best genome
    const bestInGen = currentGen.genomes.reduce((a, b) => a.fitness_score > b.fitness_score ? a : b);
    if (!session.best_genome || bestInGen.fitness_score > session.best_genome.fitness_score) {
      session.best_genome = bestInGen;
    }

    session.updated_at = new Date();
  }

  /**
   * Evolve to next generation
   */
  evolve(sessionId: string): EvolutionGeneration {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const method = getMethodById(session.method_id);
    if (!method) {
      throw new Error(`Method not found: ${session.method_id}`);
    }

    const currentGen = session.generations[session.generations.length - 1];
    const newGenNumber = currentGen.generation_number + 1;

    // Check termination conditions
    if (newGenNumber >= session.config.max_generations) {
      session.status = 'completed';
    }

    if (currentGen.best_fitness >= session.config.fitness_threshold) {
      session.status = 'completed';
    }

    // Sort by fitness
    const sorted = [...currentGen.genomes].sort((a, b) => b.fitness_score - a.fitness_score);

    // Create new generation
    const newGenomes: EvolutionGenome[] = [];

    // Elitism - keep top performers
    for (let i = 0; i < session.config.elite_count; i++) {
      newGenomes.push({
        ...sorted[i],
        id: `genome_${newGenNumber}_${i}`,
        generation: newGenNumber,
        parent_ids: [sorted[i].id],
        mutations: [],
      });
    }

    // Generate rest through crossover and mutation
    while (newGenomes.length < session.config.population_size) {
      const genome = this.createOffspring(sorted, newGenNumber, newGenomes.length, session.config, method);
      newGenomes.push(genome);
    }

    const newGeneration: EvolutionGeneration = {
      generation_number: newGenNumber,
      genomes: newGenomes,
      avg_fitness: 50, // Will be updated with feedback
      best_fitness: 50,
      diversity_score: this.calculateDiversity(newGenomes),
      completed_at: new Date(),
    };

    session.generations.push(newGeneration);
    session.total_genomes += newGenomes.length;
    session.updated_at = new Date();

    return newGeneration;
  }

  /**
   * Create offspring through crossover and mutation
   */
  private createOffspring(
    parents: EvolutionGenome[],
    generation: number,
    index: number,
    config: EvolutionConfig,
    method: VisualMethod
  ): EvolutionGenome {
    // Select parents based on fitness (tournament selection)
    const parent1 = this.tournamentSelect(parents);
    const parent2 = this.tournamentSelect(parents);

    let childParams: Record<string, unknown>;

    // Crossover
    if (Math.random() < config.crossover_rate) {
      childParams = this.crossover(parent1.params, parent2.params);
    } else {
      childParams = { ...parent1.params };
    }

    // Mutation
    childParams = this.mutateParams(childParams, method, config.mutation_rate);

    return {
      id: `genome_${generation}_${index}`,
      generation,
      params: childParams,
      fitness_score: 50,
      parent_ids: [parent1.id, parent2.id],
      mutations: this.recordMutations(parent1.params, childParams),
      created_at: new Date(),
    };
  }

  /**
   * Tournament selection
   */
  private tournamentSelect(population: EvolutionGenome[]): EvolutionGenome {
    const tournamentSize = 3;
    const tournament = [];

    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }

    return tournament.reduce((a, b) => a.fitness_score > b.fitness_score ? a : b);
  }

  /**
   * Crossover two parameter sets
   */
  private crossover(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const key of keys) {
      // Uniform crossover
      result[key] = Math.random() < 0.5 ? a[key] : b[key];
    }

    return result;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): EvolutionSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get current generation
   */
  getCurrentGeneration(sessionId: string): EvolutionGeneration | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.generations.length === 0) {
return null;
}
    return session.generations[session.generations.length - 1];
  }

  /**
   * Get evolution history
   */
  getEvolutionHistory(sessionId: string): { generation: number; avg_fitness: number; best_fitness: number }[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
return [];
}

    return session.generations.map(g => ({
      generation: g.generation_number,
      avg_fitness: g.avg_fitness,
      best_fitness: g.best_fitness,
    }));
  }

  /**
   * Pause evolution session
   */
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.updated_at = new Date();
    }
  }

  /**
   * Resume evolution session
   */
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      session.updated_at = new Date();
    }
  }
}

export default EvolutionPipeline;
