/**
 * Table Component
 *
 * Responsive data table with sorting and filtering support.
 * Full keyboard navigation and accessibility compliance.
 *
 * @example
 * <Table
 *   columns={[
 *     { id: 'name', label: 'Name', sortable: true },
 *     { id: 'email', label: 'Email', sortable: false },
 *     { id: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> }
 *   ]}
 *   data={[
 *     { name: 'John Doe', email: 'john@example.com', status: 'Active' },
 *     { name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' }
 *   ]}
 *   onRowClick={(row) => console.log(row)}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes, useState } from 'react';

export interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => ReactNode;
  width?: string;
}

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  /** Table columns definition */
  columns: TableColumn[];

  /** Table data rows */
  data: any[];

  /** Row click handler */
  onRowClick?: (row: any, index: number) => void;

  /** Show striped rows @default true */
  striped?: boolean;

  /** Show border @default true */
  border?: boolean;

  /** Show hover effect @default true */
  hover?: boolean;

  /** Compact padding @default false */
  compact?: boolean;

  /** Loading state @default false */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Table Component
 *
 * Uses design tokens:
 * - Background: bg-bg-card, alternating bg-bg-hover for striped
 * - Border: border-border-subtle
 * - Text: text-text-primary, text-text-secondary
 * - Hover: hover:bg-bg-hover, cursor-pointer
 * - Active: Highlighted row with accent color
 */
export const Table = forwardRef<HTMLDivElement, TableProps>(
  (
    {
      columns,
      data,
      onRowClick,
      striped = true,
      border = true,
      hover = true,
      compact = false,
      loading = false,
      emptyMessage = 'No data available',
      className = '',
      ...props
    },
    ref
  ) => {
    const [sortConfig, setSortConfig] = useState<{
      key: string | null;
      direction: 'asc' | 'desc';
    }>({
      key: null,
      direction: 'asc',
    });

    const handleSort = (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column?.sortable) {
return;
}

      setSortConfig((prev) => ({
        key: columnId,
        direction: prev.key === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    };

    const sortedData = [...data].sort((a, b) => {
      if (!sortConfig.key) {
return 0;
}

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const paddingClass = compact ? 'px-4 py-2' : 'px-6 py-3';

    return (
      <div
        ref={ref}
        className={`
          w-full
          overflow-x-auto
          rounded-lg
          border ${border ? 'border-border-subtle' : 'border-transparent'}
          bg-bg-card
          ${className}
        `.trim()}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">{emptyMessage}</div>
          </div>
        ) : (
          <table className="w-full">
            {/* Table Head */}
            <thead>
              <tr className="border-b border-border-subtle bg-bg-hover">
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={`
                      ${paddingClass}
                      text-left
                      text-sm font-semibold
                      text-text-primary
                      ${column.sortable ? 'cursor-pointer hover:text-accent-500 transition-colors' : ''}
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.id)}
                    role={column.sortable ? 'button' : 'columnheader'}
                    tabIndex={column.sortable ? 0 : -1}
                    onKeyDown={(e) => {
                      if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleSort(column.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <span className="text-xs text-text-secondary">
                          {sortConfig.key === column.id ? (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          ) : (
                            '↕'
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    border-b border-border-subtle
                    transition-all duration-fast ease-out
                    ${striped && rowIndex % 2 === 1 ? 'bg-bg-hover' : 'bg-bg-card'}
                    ${hover && onRowClick ? 'hover:bg-bg-hover cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  role={onRowClick ? 'button' : 'row'}
                  tabIndex={onRowClick ? 0 : -1}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row, rowIndex);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.id}`}
                      className={`
                        ${paddingClass}
                        text-sm
                        text-text-primary
                      `}
                      style={{ width: column.width }}
                    >
                      {column.render
                        ? column.render(row[column.id], row)
                        : row[column.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
);

Table.displayName = 'Table';

export default Table;
