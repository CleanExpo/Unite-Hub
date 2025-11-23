/**
 * Table Component
 * Phase 37: UI/UX Polish
 *
 * Standardized responsive table with consistent styling
 */

import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-0">
      <div className="inline-block min-w-full align-middle">
        <table
          className={`
            min-w-full divide-y divide-gray-200 dark:divide-gray-700
            ${className}
          `}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children, className = "" }: TableProps) {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800/50 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }: TableProps) {
  return (
    <tbody
      className={`
        divide-y divide-gray-200 dark:divide-gray-700
        bg-white dark:bg-gray-800
        ${className}
      `}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "" }: TableProps) {
  return (
    <tr
      className={`
        hover:bg-gray-50 dark:hover:bg-gray-700/50
        transition-colors
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  className = "",
  align = "left",
}: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={`
        px-4 py-3
        text-xs font-semibold uppercase tracking-wider
        text-gray-500 dark:text-gray-400
        ${alignClass}
        ${className}
      `}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  align = "left",
}: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td
      className={`
        px-4 py-3
        text-sm text-gray-900 dark:text-gray-100
        whitespace-nowrap
        ${alignClass}
        ${className}
      `}
    >
      {children}
    </td>
  );
}

export function TableEmpty({
  message = "No data available",
  colSpan = 1,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        {message}
      </td>
    </tr>
  );
}

export default Table;
