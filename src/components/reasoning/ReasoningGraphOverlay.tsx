'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Link2 } from 'lucide-react';

interface Memory {
  id: string;
  memoryType: string;
  content?: string;
  importance?: number;
  confidence?: number;
}

interface PassArtifact {
  id: string;
  artifact_type: string;
  content?: string;
}

interface Pass {
  pass_number: number;
  pass_type: string;
  artifacts?: PassArtifact[];
  memory_references?: string[];
}

interface ReasoningGraphOverlayProps {
  passes: Pass[];
  relatedMemories?: Record<string, Memory[]>;
}

export function ReasoningGraphOverlay({
  passes,
  relatedMemories = {},
}: ReasoningGraphOverlayProps) {
  const [expandedPass, setExpandedPass] = useState<number | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  // Build a map of which memories influenced which passes
  const memoryToPassMap = useMemo(() => {
    const map: Record<string, Set<number>> = {};

    passes.forEach((pass) => {
      pass.memory_references?.forEach((memoryId) => {
        if (!map[memoryId]) {
          map[memoryId] = new Set();
        }
        map[memoryId].add(pass.pass_number);
      });
    });

    return map;
  }, [passes]);

  const memoryTypeColors: Record<string, string> = {
    interaction: 'bg-blue-100 text-blue-800',
    insight: 'bg-purple-100 text-purple-800',
    pattern: 'bg-green-100 text-green-800',
    lesson: 'bg-orange-100 text-orange-800',
    decision: 'bg-red-100 text-red-800',
    context: 'bg-cyan-100 text-cyan-800',
  };

  const passTypeEmojis: Record<string, string> = {
    recall: '🧠',
    analysis: '📊',
    draft: '✍️',
    refinement: '🔄',
    validation: '✅',
  };

  const allMemories = useMemo(() => {
    const memories = new Map<string, Memory>();

    Object.values(relatedMemories).forEach((memoryList) => {
      memoryList.forEach((memory) => {
        memories.set(memory.id, memory);
      });
    });

    return Array.from(memories.values());
  }, [relatedMemories]);

  return (
    <div className="w-full space-y-6">
      {/* Graph Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Reasoning Impact Graph</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Shows which memories influenced each reasoning pass
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Pass Flow */}
            <div className="space-y-3">
              {passes.map((pass, index) => (
                <div key={pass.pass_number}>
                  {/* Pass Node */}
                  <div
                    onClick={() => setExpandedPass(expandedPass === pass.pass_number ? null : pass.pass_number)}
                    className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{passTypeEmojis[pass.pass_type]}</span>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Pass {pass.pass_number}: {pass.pass_type.charAt(0).toUpperCase() + pass.pass_type.slice(1)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {pass.artifacts?.length || 0} artifacts, {pass.memory_references?.length || 0} memory references
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          expandedPass === pass.pass_number ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Expanded Pass Details */}
                    {expandedPass === pass.pass_number && (
                      <div className="mt-4 pt-4 border-t border-blue-300 space-y-4">
                        {/* Connected Memories */}
                        {pass.memory_references && pass.memory_references.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Link2 className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium">Memory References</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pass.memory_references.map((memoryId) => {
                                const memory = allMemories.find((m) => m.id === memoryId);
                                return (
                                  <button
                                    key={memoryId}
                                    onClick={() => setSelectedMemory(selectedMemory === memoryId ? null : memoryId)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                      memory
                                        ? memoryTypeColors[memory.memoryType] || 'bg-gray-100 text-gray-800'
                                        : 'bg-gray-100 text-gray-800'
                                    } hover:shadow-md`}
                                  >
                                    {memory?.content?.substring(0, 30) || memoryId.substring(0, 8)}
                                    {memory?.content && '...'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Artifacts */}
                        {pass.artifacts && pass.artifacts.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Artifacts</div>
                            <div className="space-y-1">
                              {pass.artifacts.map((artifact) => (
                                <div
                                  key={artifact.id}
                                  className="text-xs bg-white p-2 rounded border border-blue-200"
                                >
                                  <Badge variant="secondary" className="text-xs">
                                    {artifact.artifact_type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Arrow to next pass */}
                  {index < passes.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="text-blue-400 text-xl">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Influence Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Influence</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            How frequently each memory influenced the reasoning process
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allMemories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No memory references found in this reasoning run</p>
              </div>
            ) : (
              allMemories.map((memory) => {
                const passCount = memoryToPassMap[memory.id]?.size || 0;
                const isSelected = selectedMemory === memory.id;

                return (
                  <div
                    key={memory.id}
                    onClick={() => setSelectedMemory(isSelected ? null : memory.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={memoryTypeColors[memory.memoryType] || 'bg-gray-100 text-gray-800'}>
                            {memory.memoryType}
                          </Badge>
                          {passCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Used in {passCount} pass{passCount !== 1 ? 'es' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {memory.content || 'No content'}
                        </p>
                      </div>
                    </div>

                    {/* Memory Metrics */}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-600">Importance</div>
                        <div className="text-sm font-semibold">{memory.importance || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Confidence</div>
                        <div className="text-sm font-semibold">{memory.confidence || '-'}</div>
                      </div>
                    </div>

                    {/* Pass influence visualization */}
                    {passCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">Influenced Passes</div>
                        <div className="flex gap-1">
                          {Array.from({ length: passes.length }).map((_, idx) => {
                            const passNum = idx + 1;
                            const isInfluenced = memoryToPassMap[memory.id]?.has(passNum);

                            return (
                              <div
                                key={passNum}
                                className={`flex-1 h-6 rounded text-xs font-bold flex items-center justify-center transition-all ${
                                  isInfluenced
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                              >
                                {passNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Memory Detail */}
      {selectedMemory && (
        <Card className="border-2 border-purple-500">
          <CardHeader>
            <CardTitle className="text-lg">Memory Details</CardTitle>
          </CardHeader>
          <CardContent>
            {allMemories.find((m) => m.id === selectedMemory) && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 mb-2">Content</div>
                  <p className="text-sm text-gray-900">
                    {allMemories.find((m) => m.id === selectedMemory)?.content}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Memory Type</div>
                    <div className="text-sm font-semibold">
                      {allMemories.find((m) => m.id === selectedMemory)?.memoryType}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Importance</div>
                    <div className="text-sm font-semibold">
                      {allMemories.find((m) => m.id === selectedMemory)?.importance || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Confidence</div>
                    <div className="text-sm font-semibold">
                      {allMemories.find((m) => m.id === selectedMemory)?.confidence || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
