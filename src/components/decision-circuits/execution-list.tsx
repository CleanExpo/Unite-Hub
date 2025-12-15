/**
 * Execution List Component
 * Displays audit trail of executions in a formatted table
 */

import { format } from 'date-fns';

interface ExecutionRecord {
  id: string;
  execution_id?: string;
  circuit_id?: string;
  circuit_execution_id?: string;
  agent_type?: string;
  success: boolean;
  started_at: string;
  completed_at?: string;
  failure_reason?: string;
  metrics?: Record<string, unknown>;
}

interface ExecutionListProps {
  executions: ExecutionRecord[];
  columns: ('id' | 'type' | 'status' | 'time' | 'duration' | 'error' | 'metrics')[];
  title?: string;
  emptyMessage?: string;
}

export function ExecutionList({
  executions,
  columns,
  title,
  emptyMessage = 'No executions found',
}: ExecutionListProps) {
  if (!executions || executions.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-6 border border-border-subtle text-center">
        {title && <h3 className="text-lg font-semibold mb-4 text-text-primary">{title}</h3>}
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  const getDuration = (start: string, end?: string): string => {
    if (!end) {
return '-';
}
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = endTime - startTime;
    if (duration < 1000) {
return `${duration}ms`;
}
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden">
      {title && (
        <div className="border-b border-border-subtle px-6 py-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-hover">
              {columns.includes('id') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">ID</th>
              )}
              {columns.includes('type') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">Type</th>
              )}
              {columns.includes('status') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">Status</th>
              )}
              {columns.includes('time') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">Time</th>
              )}
              {columns.includes('duration') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">Duration</th>
              )}
              {columns.includes('error') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">Error</th>
              )}
              {columns.includes('metrics') && (
                <th className="px-6 py-3 text-left text-text-secondary font-medium">Metrics</th>
              )}
            </tr>
          </thead>
          <tbody>
            {executions.map((execution, idx) => (
              <tr
                key={execution.id}
                className={`border-b border-border-subtle ${
                  idx % 2 === 0 ? 'bg-bg-base' : 'bg-bg-card'
                } hover:bg-bg-hover transition-colors`}
              >
                {columns.includes('id') && (
                  <td className="px-6 py-3 text-text-primary font-mono text-xs">
                    {execution.id.slice(0, 8)}...
                  </td>
                )}
                {columns.includes('type') && (
                  <td className="px-6 py-3 text-text-secondary">
                    <span className="inline-block px-2 py-1 rounded-sm bg-accent-100 text-accent-600 text-xs font-medium">
                      {execution.circuit_id || execution.agent_type || 'Unknown'}
                    </span>
                  </td>
                )}
                {columns.includes('status') && (
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium ${
                        execution.success
                          ? 'bg-success-50 text-success-500'
                          : 'bg-error-50 text-error-500'
                      }`}
                    >
                      {execution.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </td>
                )}
                {columns.includes('time') && (
                  <td className="px-6 py-3 text-text-secondary text-xs">
                    {format(new Date(execution.started_at), 'MMM d, HH:mm:ss')}
                  </td>
                )}
                {columns.includes('duration') && (
                  <td className="px-6 py-3 text-text-secondary text-xs">
                    {getDuration(execution.started_at, execution.completed_at)}
                  </td>
                )}
                {columns.includes('error') && (
                  <td className="px-6 py-3 text-text-muted text-xs max-w-xs truncate">
                    {execution.failure_reason || '-'}
                  </td>
                )}
                {columns.includes('metrics') && (
                  <td className="px-6 py-3 text-text-muted text-xs">
                    {execution.metrics && Object.keys(execution.metrics).length > 0 ? (
                      <span className="text-accent-400">
                        {Object.keys(execution.metrics).length} fields
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
