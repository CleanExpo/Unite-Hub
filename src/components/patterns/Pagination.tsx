/**
 * Pagination Component
 *
 * Page navigation for large datasets with intelligent ellipsis.
 * Keyboard accessible and fully customizable page range display.
 *
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={20}
 *   onPageChange={setPage}
 * />
 *
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={100}
 *   onPageChange={setPage}
 *   maxVisible={7}
 *   showPageNumbers
 * />
 */

import { forwardRef, HTMLAttributes } from 'react';

export interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  /** Current active page (1-indexed) */
  currentPage: number;

  /** Total number of pages */
  totalPages: number;

  /** Callback when page changes */
  onPageChange: (page: number) => void;

  /** Show page numbers in pagination */
  showPageNumbers?: boolean;

  /** Max page numbers to show (including ellipsis) */
  maxVisible?: number;

  /** Custom CSS class */
  className?: string;
}

/**
 * Pagination Component
 *
 * Uses design tokens:
 * - Active page: bg-accent-500, text-white
 * - Inactive page: border-border-subtle, text-text-primary, hover:bg-bg-hover
 * - Disabled: opacity-50, cursor-not-allowed
 * - Focus: ring-accent-500
 * - Animations: duration-fast, ease-out
 */
export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      showPageNumbers = true,
      maxVisible = 7,
      className = '',
      ...props
    },
    ref
  ) => {
    // Calculate visible page range
    const getPageNumbers = (): (number | string)[] => {
      if (totalPages <= maxVisible) {
        // Show all pages
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const pages: (number | string)[] = [];
      const leftSiblings = currentPage - 1;
      const rightSiblings = totalPages - currentPage;

      // Always show first and last page
      pages.push(1);

      if (leftSiblings >= 1) {
        if (leftSiblings > 1) {
          pages.push('...');
        }
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (rightSiblings >= 1) {
        if (rightSiblings > 1) {
          pages.push('...');
        }
      }

      // Add last page if not already included
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }

      return pages;
    };

    const pageNumbers = showPageNumbers ? getPageNumbers() : [];

    const handlePrevious = () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    const handleNext = () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, page: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPageChange(page);
      }
    };

    return (
      <nav
        ref={ref}
        className={`flex items-center justify-center gap-2 ${className}`}
        aria-label="Pagination"
        {...props}
      >
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`
            px-3 py-2
            text-sm
            font-medium
            rounded-lg
            border border-border-subtle
            transition-colors duration-fast
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
            ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'text-text-primary hover:bg-bg-hover cursor-pointer'
            }
          `}
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <div className="flex gap-1">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-sm text-text-secondary"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  onKeyDown={e => handleKeyDown(e, pageNum)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    min-w-[40px]
                    px-3 py-2
                    text-sm
                    font-medium
                    rounded-lg
                    transition-colors duration-fast
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                    ${
                      isActive
                        ? 'bg-accent-500 text-white font-semibold'
                        : 'border border-border-subtle text-text-primary hover:bg-bg-hover cursor-pointer'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-2
            text-sm
            font-medium
            rounded-lg
            border border-border-subtle
            transition-colors duration-fast
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
            ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'text-text-primary hover:bg-bg-hover cursor-pointer'
            }
          `}
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Page Info */}
        {!showPageNumbers && (
          <span className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
