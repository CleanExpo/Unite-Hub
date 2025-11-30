/**
 * ActivityFeed Component
 *
 * Timeline of activities/events with icons, descriptions, and timestamps.
 * Used for activity logs, notification history, and event timelines.
 *
 * @example
 * <ActivityFeed
 *   items={[
 *     {
 *       title: "Contact Added",
 *       description: "John Doe was added to your contacts",
 *       timestamp: "2 hours ago",
 *       icon: <AddIcon />,
 *       color: "success"
 *     },
 *     // ... more items
 *   ]}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface ActivityItem {
  id?: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
  color?: 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  metadata?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ActivityFeedProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of activity items */
  items: ActivityItem[];

  /** Show timeline connector @default true */
  showConnectors?: boolean;

  /** Max items to display (with load more) @default undefined */
  maxItems?: number;

  /** Loading state @default false */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * ActivityFeed Component
 *
 * Uses design tokens:
 * - Timeline: border-border-subtle
 * - Icons: Color based on activity type (accent-500, success-500, etc.)
 * - Text: text-text-primary, text-text-secondary
 * - Background: bg-bg-card, hover effects
 */
export const ActivityFeed = forwardRef<HTMLDivElement, ActivityFeedProps>(
  (
    {
      items,
      showConnectors = true,
      maxItems,
      loading = false,
      emptyMessage = 'No activities yet',
      className = '',
      ...props
    },
    ref
  ) => {
    const colorClasses = {
      accent: 'bg-accent-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      neutral: 'bg-border-subtle',
    };

    const displayItems = maxItems ? items.slice(0, maxItems) : items;
    const hasMore = maxItems && items.length > maxItems;

    return (
      <div
        ref={ref}
        className={`
          w-full
          ${className}
        `.trim()}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading activities...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">{emptyMessage}</div>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {displayItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  {/* Timeline Connector */}
                  {showConnectors && index < displayItems.length - 1 && (
                    <div
                      className="absolute left-4 md:left-5 top-12 bottom-0 w-0.5 bg-border-subtle"
                      aria-hidden="true"
                    />
                  )}

                  {/* Activity Icon/Circle */}
                  <div
                    className={`
                      flex-shrink-0
                      w-10 h-10 md:w-11 md:h-11
                      rounded-full
                      flex items-center justify-center
                      text-white
                      font-bold
                      ${colorClasses[item.color || 'neutral']}
                      relative z-10
                      mt-1
                    `}
                  >
                    {item.icon ? item.icon : '•'}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    {/* Title and Timestamp */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4 mb-1">
                      <h3 className="font-semibold text-text-primary text-sm md:text-base">
                        {item.title}
                      </h3>
                      <span className="text-xs md:text-sm text-text-secondary flex-shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-text-secondary text-sm mb-2">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata and Action */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      {item.metadata && (
                        <div className="text-xs text-text-secondary">
                          {item.metadata}
                        </div>
                      )}

                      {item.action && (
                        <button
                          onClick={item.action.onClick}
                          className={`
                            text-xs font-medium
                            text-accent-500
                            hover:text-accent-400
                            transition-colors duration-fast
                            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                            rounded px-2 py-1
                          `}
                        >
                          {item.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-6 border-t border-border-subtle">
                <button
                  className={`
                    px-4 py-2
                    text-sm font-medium
                    text-accent-500
                    bg-bg-hover
                    border border-border-subtle
                    rounded-md
                    hover:bg-bg-card hover:border-border-medium
                    transition-all duration-normal ease-out
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                  `}
                >
                  Load more ({items.length - maxItems} more)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;
