/**
 * Tooltip Component
 *
 * Lightweight tooltip that displays on hover or focus.
 * Provides positioning variants (top, bottom, left, right, auto)
 * with smooth animations and full keyboard accessibility.
 *
 * @example
 * <Tooltip content="Click to save" position="top">
 *   <Button>Save</Button>
 * </Tooltip>
 *
 * @example
 * <Tooltip content="Profile settings" position="right" theme="light">
 *   <Icon name="settings" />
 * </Tooltip>
 */

import { forwardRef, ReactNode, useState, useRef, useEffect, HTMLAttributes } from 'react';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** Tooltip content text or node */
  content: string | ReactNode;

  /** Position relative to trigger element */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';

  /** Theme variant */
  theme?: 'dark' | 'light';

  /** Delay before showing tooltip (ms) */
  delay?: number;

  /** Child element that triggers tooltip */
  children: ReactNode;

  /** Custom CSS class */
  className?: string;
}

/**
 * Tooltip Component
 *
 * Uses design tokens:
 * - Dark theme: bg-text-primary, text-white
 * - Light theme: bg-bg-card, border-border-subtle, text-text-primary
 * - Animations: duration-fast, ease-out
 * - Spacing: gap-2, px-3, py-2
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      position = 'top',
      theme = 'dark',
      delay = 200,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(position as any);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    // Handle show with delay
    const handleShow = () => {
      if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        updatePosition();
      }, delay);
    };

    // Handle hide
    const handleHide = () => {
      if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
      setIsVisible(false);
    };

    // Calculate actual position based on available space
    const updatePosition = () => {
      if (position !== 'auto' || !triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const gap = 8;

      // Check available space
      const spaceTop = triggerRect.top;
      const spaceBottom = window.innerHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = window.innerWidth - triggerRect.right;

      let calculatedPosition: 'top' | 'bottom' | 'left' | 'right' = position as any;

      if (position === 'auto') {
        // Prefer vertical positioning
        if (spaceTop > tooltipRect.height + gap) {
          calculatedPosition = 'top';
        } else if (spaceBottom > tooltipRect.height + gap) {
          calculatedPosition = 'bottom';
        } else if (spaceLeft > tooltipRect.width + gap) {
          calculatedPosition = 'left';
        } else if (spaceRight > tooltipRect.width + gap) {
          calculatedPosition = 'right';
        } else {
          calculatedPosition = 'top'; // Fallback
        }
      }

      setActualPosition(calculatedPosition);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
      };
    }, []);

    // Reposition on window resize
    useEffect(() => {
      if (!isVisible) {
return;
}

      const handleResize = () => updatePosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [isVisible, position]);

    // Position classes
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 translate-x-2 ml-2',
    };

    // Arrow position classes
    const arrowClasses = {
      top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-8 border-transparent',
      bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-8 border-transparent',
      left: 'right-[-4px] top-1/2 -translate-y-1/2 border-8 border-transparent',
      right: 'left-[-4px] top-1/2 -translate-y-1/2 border-8 border-transparent',
    };

    // Theme classes
    const themeClasses = {
      dark: {
        bg: 'bg-text-primary',
        text: 'text-white',
        arrow: 'border-text-primary',
      },
      light: {
        bg: 'bg-bg-card',
        text: 'text-text-primary',
        arrow: 'border-bg-card',
      },
    };

    const theme_classes = themeClasses[theme];
    const arrowBorderColor = {
      dark: 'border-text-primary',
      light: 'border-bg-card',
    };

    const arrowTopColor = {
      top: {
        dark: 'border-b-text-primary',
        light: 'border-b-bg-card',
      },
      bottom: {
        dark: 'border-t-text-primary',
        light: 'border-t-bg-card',
      },
      left: {
        dark: 'border-r-text-primary',
        light: 'border-r-bg-card',
      },
      right: {
        dark: 'border-l-text-primary',
        light: 'border-l-bg-card',
      },
    };

    return (
      <div
        ref={ref}
        className={`relative inline-block ${className}`}
        {...props}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onFocus={handleShow}
        onBlur={handleHide}
      >
        {/* Trigger element */}
        <div ref={triggerRef} className="inline-block">
          {children}
        </div>

        {/* Tooltip */}
        {isVisible && (
          <div
            ref={tooltipRef}
            className={`
              absolute
              ${positionClasses[actualPosition]}
              z-50
              px-3 py-2
              text-sm
              whitespace-nowrap
              rounded-md
              pointer-events-none
              animate-in fade-in duration-100
              ${theme_classes.bg}
              ${theme_classes.text}
            `}
            role="tooltip"
          >
            {/* Arrow */}
            <div
              className={`
                absolute
                ${arrowClasses[actualPosition]}
                ${arrowTopColor[actualPosition][theme]}
              `}
            />

            {/* Content */}
            {content}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
