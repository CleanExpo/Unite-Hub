/**
 * AILoader Component - Phase 2 AI Library
 * Animated AI thinking indicator
 */

import React from 'react';

export default function AILoader({ message = 'AI is thinking...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">
        {message}
      </span>
    </div>
  );
}

// Named export for compatibility
export { AILoader };
