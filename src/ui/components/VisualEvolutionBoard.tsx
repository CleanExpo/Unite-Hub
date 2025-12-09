'use client';

/**
 * Visual Evolution Board
 * Phase 68: Display evolution session with genome variations and fitness tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GitBranch,
  Star,
  TrendingUp,
  Dna,
  Play,
  Pause,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface Genome {
  id: string;
  generation: number;
  params: Record<string, unknown>;
  fitness_score: number;
  parent_ids: string[];
}

interface VisualEvolutionBoardProps {
  session_id: string;
  method_name: string;
  status: 'active' | 'paused' | 'completed';
  current_generation: number;
  max_generations: number;
  genomes: Genome[];
  best_genome: Genome | null;
  avg_fitness: number;
  diversity_score: number;
  onRate?: (genomeId: string, rating: number) => void;
  onEvolve?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export function VisualEvolutionBoard({
  method_name,
  status,
  current_generation,
  max_generations,
  genomes,
  best_genome,
  avg_fitness,
  diversity_score,
  onRate,
  onEvolve,
  onPause,
  onResume,
}: VisualEvolutionBoardProps) {
  const [selectedGenome, setSelectedGenome] = useState<string | null>(null);

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500', label: 'Active' };
      case 'paused':
        return { color: 'bg-yellow-500', label: 'Paused' };
      case 'completed':
        return { color: 'bg-blue-500', label: 'Completed' };
    }
  };

  const statusConfig = getStatusConfig();

  const getFitnessColor = (score: number) => {
    if (score >= 80) {
return 'text-green-500';
}
    if (score >= 60) {
return 'text-yellow-500';
}
    if (score >= 40) {
return 'text-orange-500';
}
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-base">{method_name}</CardTitle>
              <div className="text-xs text-muted-foreground">
                Evolution Session
              </div>
            </div>
          </div>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Generation {current_generation} / {max_generations}</span>
            <span>{Math.round((current_generation / max_generations) * 100)}%</span>
          </div>
          <Progress value={(current_generation / max_generations) * 100} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold">{avg_fitness.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Avg Fitness</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold text-green-500">
              {best_genome?.fitness_score.toFixed(0) || '-'}
            </div>
            <div className="text-xs text-muted-foreground">Best</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold">{diversity_score.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Diversity</div>
          </div>
        </div>

        {/* Genome grid */}
        <div className="grid grid-cols-4 gap-2">
          {genomes.map((genome) => (
            <div
              key={genome.id}
              className={`
                p-2 rounded border cursor-pointer transition-all
                ${selectedGenome === genome.id ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-primary/50'}
                ${genome.id === best_genome?.id ? 'bg-green-500/10' : 'bg-muted/50'}
              `}
              onClick={() => setSelectedGenome(genome.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  Gen {genome.generation}
                </span>
                {genome.id === best_genome?.id && (
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className={`text-sm font-bold ${getFitnessColor(genome.fitness_score)}`}>
                {genome.fitness_score.toFixed(0)}
              </div>

              {/* Rating buttons */}
              {onRate && (
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate(genome.id, 5);
                    }}
                    className="p-1 hover:bg-green-500/20 rounded"
                  >
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate(genome.id, 1);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <ThumbsDown className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected genome details */}
        {selectedGenome && (
          <div className="p-3 bg-muted rounded text-xs">
            <div className="font-medium mb-2">Genome Details</div>
            <div className="space-y-1 text-muted-foreground">
              {genomes.find(g => g.id === selectedGenome)?.parent_ids.length ? (
                <div className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  Parents: {genomes.find(g => g.id === selectedGenome)?.parent_ids.join(', ')}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Dna className="h-3 w-3" />
                  Initial genome
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between pt-2 border-t">
          {status === 'active' ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1 text-xs text-yellow-500 hover:underline"
            >
              <Pause className="h-3 w-3" />
              Pause
            </button>
          ) : status === 'paused' ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1 text-xs text-green-500 hover:underline"
            >
              <Play className="h-3 w-3" />
              Resume
            </button>
          ) : (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground"
              disabled
            >
              <RotateCcw className="h-3 w-3" />
              Completed
            </button>
          )}

          {status !== 'completed' && onEvolve && (
            <button
              onClick={onEvolve}
              className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              <TrendingUp className="h-3 w-3" />
              Evolve
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default VisualEvolutionBoard;
