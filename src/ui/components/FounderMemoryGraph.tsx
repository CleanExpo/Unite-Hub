'use client';

/**
 * Founder Memory Graph Component
 * Phase 51: Visual representation of memory nodes
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, FolderKanban, FileText, Receipt, CheckSquare, Calendar,
  Users, Mail, Mic, DollarSign, Search, Network, Info
} from 'lucide-react';
import { useState } from 'react';

interface MemoryNode {
  id: string;
  node_type: string;
  title: string;
  summary?: string;
  importance_score: number;
  related_nodes: string[];
  last_accessed: string;
}

interface MemoryGraphProps {
  nodes: MemoryNode[];
  stats: {
    totalNodes: number;
    byType: Record<string, number>;
    avgImportance: number;
    recentlyAccessed: number;
  };
  onSearch?: (query: string) => void;
  onNodeClick?: (node: MemoryNode) => void;
}

const NODE_ICONS: Record<string, any> = {
  client: User,
  project: FolderKanban,
  invoice: FileText,
  receipt: Receipt,
  task: CheckSquare,
  event: Calendar,
  staff_member: Users,
  email_thread: Mail,
  voice_command: Mic,
  financial_entry: DollarSign,
};

const NODE_COLORS: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  project: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  invoice: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  receipt: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  task: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  event: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  staff_member: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  email_thread: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  voice_command: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  financial_entry: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function FounderMemoryGraph({
  nodes,
  stats,
  onSearch,
  onNodeClick,
}: MemoryGraphProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const filteredNodes = selectedType
    ? nodes.filter((n) => n.node_type === selectedType)
    : nodes;

  const getImportanceColor = (score: number) => {
    if (score >= 80) {
return 'text-green-500';
}
    if (score >= 60) {
return 'text-amber-500';
}
    return 'text-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Memory Graph
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{stats.totalNodes} nodes</span>
            <span>|</span>
            <span>Avg importance: {stats.avgImportance}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All
          </Button>
          {Object.entries(stats.byType).map(([type, count]) => {
            const Icon = NODE_ICONS[type] || Info;
            return (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="gap-1"
              >
                <Icon className="h-3 w-3" />
                {type.replace(/_/g, ' ')}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Nodes */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No nodes found
            </div>
          ) : (
            filteredNodes.map((node) => {
              const Icon = NODE_ICONS[node.node_type] || Info;
              const colorClass = NODE_COLORS[node.node_type] || 'bg-gray-100 text-gray-700';

              return (
                <div
                  key={node.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onNodeClick?.(node)}
                >
                  <div className={`p-2 rounded ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {node.title}
                      </span>
                      <span className={`text-xs font-medium ${getImportanceColor(node.importance_score)}`}>
                        {node.importance_score}%
                      </span>
                    </div>
                    {node.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {node.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(node.last_accessed).toLocaleDateString()}
                      </span>
                      {node.related_nodes.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {node.related_nodes.length} related
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FounderMemoryGraph;
