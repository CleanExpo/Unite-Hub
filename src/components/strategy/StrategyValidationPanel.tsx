'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StrategyValidation, AgentValidation, StrategyConflict } from '@/lib/strategy';
import {
  getValidationStatusColor,
  formatConsensusLevel,
  getConflictTypeColor,
  getSeverityColor,
  getAgentInfo,
} from '@/lib/strategy/strategyClient';

interface StrategyValidationPanelProps {
  validation: StrategyValidation | null;
  isLoading?: boolean;
}

export function StrategyValidationPanel({
  validation,
  isLoading = false,
}: StrategyValidationPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'summary' | 'agents' | 'conflicts' | 'recommendations' | null>('summary');

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="space-y-2">
            <div className="h-12 bg-bg-hover rounded-lg animate-pulse" />
            <div className="h-8 bg-bg-hover rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <Info className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
          Not Yet Validated
        </h3>
        <p className="text-blue-700 dark:text-blue-300">
          This strategy has not been validated by agents yet. Validate to get multi-agent insights.
        </p>
      </div>
    );
  }

  const statusColor = getValidationStatusColor(validation.overallStatus);
  const consensusInfo = formatConsensusLevel(validation.consensusLevel);

  const getRecommendationIcon = (recommendation: 'approve' | 'needs_revision' | 'reject') => {
    const icons = {
      approve: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />,
      needs_revision: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      reject: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    };
    return icons[recommendation];
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card rounded-lg border border-border-subtle p-6"
        style={{
          borderColor: statusColor.borderColor,
          backgroundColor:
            statusColor.backgroundColor + (document.documentElement.classList.contains('dark') ? '30' : ''),
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-text-secondary mb-2">Validation Status</div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: statusColor.color }}
              />
              <span
                className="text-lg font-semibold"
                style={{ color: statusColor.color }}
              >
                {statusColor.label}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-text-secondary mb-2">Validation Score</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {validation.validationScore.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-sm text-text-secondary mb-2">Consensus Level</div>
            <div
              className="text-lg font-semibold"
              style={{ color: consensusInfo.color }}
            >
              {consensusInfo.formatted}
            </div>
            <div className="text-xs text-text-secondary capitalize mt-1">
              {consensusInfo.interpretation} agreement
            </div>
          </div>
        </div>
      </motion.div>

      {/* Agent Validations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden"
      >
        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'agents' ? null : 'agents')
          }
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-bg-hover transition-colors"
        >
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />

          <div className="flex-1 text-left">
            <h3 className="font-semibold text-text-primary">
              Agent Validations
            </h3>
            <p className="text-sm text-text-secondary">
              {validation.agentValidations.length} agents evaluated this strategy
            </p>
          </div>

          <span className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold px-3 py-1 rounded-full">
            {validation.agentValidations.length}
          </span>

          {expandedSection === 'agents' ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'agents' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border-subtle"
            >
              <div className="p-6 space-y-4">
                {validation.agentValidations.map((agent, idx) => {
                  const agentInfo = getAgentInfo(agent.agentId);
                  const recommendationIcon = getRecommendationIcon(agent.recommendation);

                  return (
                    <motion.div
                      key={agent.agentId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-bg-raised rounded-lg p-4 border border-border-subtle"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-bg-card"
                            style={{
                              borderColor: agentInfo.color,
                              borderWidth: '2px',
                            }}
                          >
                            {agentInfo.icon}
                          </div>

                          <div>
                            <h4 className="font-semibold text-text-primary">
                              {agentInfo.label}
                            </h4>
                            <p className="text-sm text-text-secondary">
                              {agentInfo.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">{recommendationIcon}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-text-secondary mb-1">
                            Validation Score
                          </div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {agent.validationScore.toFixed(1)}%
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-text-secondary mb-1">
                            Risk Assessment
                          </div>
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {agent.riskAssessment.toFixed(1)}%
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-text-secondary mb-1">
                            Recommendation
                          </div>
                          <div className="text-sm font-semibold capitalize">
                            {agent.recommendation.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>

                      {agent.reasoning && (
                        <div className="bg-bg-card rounded p-3 mb-3">
                          <div className="text-xs text-text-secondary mb-1 font-semibold">
                            Reasoning
                          </div>
                          <p className="text-sm text-text-secondary">
                            {agent.reasoning}
                          </p>
                        </div>
                      )}

                      {agent.supportingPoints && agent.supportingPoints.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-text-secondary mb-2 font-semibold">
                            Supporting Points
                          </div>
                          <div className="space-y-1">
                            {agent.supportingPoints.map((point, pidx) => (
                              <div
                                key={pidx}
                                className="text-sm text-text-secondary flex items-start gap-2"
                              >
                                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {agent.concerns && agent.concerns.length > 0 && (
                        <div>
                          <div className="text-xs text-text-secondary mb-2 font-semibold">
                            Concerns
                          </div>
                          <div className="space-y-1">
                            {agent.concerns.map((concern, cidx) => (
                              <div
                                key={cidx}
                                className="text-sm text-text-secondary flex items-start gap-2"
                              >
                                <span className="text-amber-600 dark:text-amber-400 mt-1">⚠</span>
                                <span>{concern}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Conflicts */}
      {validation.conflicts && validation.conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'conflicts' ? null : 'conflicts')
            }
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-bg-hover transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />

            <div className="flex-1 text-left">
              <h3 className="font-semibold text-text-primary">
                Detected Conflicts
              </h3>
              <p className="text-sm text-text-secondary">
                {validation.conflicts.length} potential conflict{validation.conflicts.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold px-3 py-1 rounded-full">
              {validation.conflicts.length}
            </span>

            {expandedSection === 'conflicts' ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'conflicts' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border-subtle"
              >
                <div className="p-6 space-y-4">
                  {validation.conflicts.map((conflict, idx) => {
                    const conflictColor = getConflictTypeColor(conflict.type);
                    const severityColor = getSeverityColor(conflict.severity);

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-bg-raised rounded-lg p-4 border"
                        style={{
                          borderColor: conflictColor.borderColor,
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-text-primary flex-1">
                            {conflict.type.replace(/_/g, ' ').toUpperCase()}
                          </h4>

                          <div
                            className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                            style={{
                              backgroundColor: severityColor.backgroundColor,
                              color: severityColor.color,
                            }}
                          >
                            {conflict.severity.toUpperCase()}
                          </div>
                        </div>

                        <p className="text-sm text-text-secondary mb-3">
                          {conflict.description}
                        </p>

                        {conflict.items && conflict.items.length > 0 && (
                          <div>
                            <div className="text-xs text-text-secondary mb-2 font-semibold">
                              Affected Items
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {conflict.items.map((item, iidx) => (
                                <span
                                  key={iidx}
                                  className="inline-block text-xs px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: conflictColor.backgroundColor,
                                    color: conflictColor.color,
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Recommendations */}
      {validation.recommendations && validation.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'recommendations' ? null : 'recommendations')
            }
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-bg-hover transition-colors"
          >
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />

            <div className="flex-1 text-left">
              <h3 className="font-semibold text-text-primary">
                Recommendations
              </h3>
              <p className="text-sm text-text-secondary">
                {validation.recommendations.length} recommendation{validation.recommendations.length !== 1 ? 's' : ''} from agents
              </p>
            </div>

            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold px-3 py-1 rounded-full">
              {validation.recommendations.length}
            </span>

            {expandedSection === 'recommendations' ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'recommendations' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border-subtle"
              >
                <div className="p-6 space-y-3">
                  {validation.recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3"
                    >
                      <div className="text-blue-600 dark:text-blue-400 mt-0.5">💡</div>
                      <p className="text-sm text-blue-900 dark:text-blue-100">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
