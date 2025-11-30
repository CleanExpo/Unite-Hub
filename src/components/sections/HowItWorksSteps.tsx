/**
 * HowItWorksSteps Component
 *
 * 4-step timeline section showing process flow.
 * Displays steps with icons, titles, and descriptions.
 *
 * @example
 * <HowItWorksSteps
 *   tag="Our Process"
 *   title="Get Started in 4 Steps"
 *   description="Simple workflow to start growing your business"
 *   steps={[
 *     { title: "Connect Your Email", description: "Link your Gmail account securely" },
 *     { title: "Sync Contacts", description: "Automatically import your contacts" },
 *     { title: "Build Campaigns", description: "Create automated drip campaigns" },
 *     { title: "Watch Growth", description: "Monitor results in real-time" }
 *   ]}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface StepItem {
  title: string;
  description: string;
  icon?: ReactNode;
  number?: number;
}

export interface HowItWorksStepsProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase tag above title */
  tag?: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Array of step items */
  steps: StepItem[];

  /** Text alignment @default 'center' */
  align?: 'left' | 'center';

  /** Show connecting lines between steps @default true */
  showConnectors?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * HowItWorksSteps Component
 *
 * Uses design tokens:
 * - Header: tag (accent-500), title (display font), description
 * - Steps: Numbered circles with bg-accent-500
 * - Text: font-body, text-text-primary, text-text-secondary
 * - Connectors: border-border-subtle lines
 */
export const HowItWorksSteps = forwardRef<HTMLDivElement, HowItWorksStepsProps>(
  (
    {
      tag,
      title,
      description,
      steps,
      align = 'center',
      showConnectors = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const alignStyles = align === 'center' ? 'text-center' : 'text-left';
    const marginAuto = align === 'center' ? 'mx-auto' : '';

    return (
      <div
        ref={ref}
        className={`
          w-full
          py-16 md:py-24 lg:py-32
          ${className}
        `.trim()}
        {...props}
      >
        {/* Header Section */}
        <div className={`mb-12 md:mb-16 ${marginAuto} ${alignStyles} max-w-2xl`}>
          {/* Tag */}
          {tag && (
            <span
              className={`
                inline-block
                text-xs
                font-extrabold
                text-accent-500
                uppercase
                tracking-widest
                mb-4
              `}
            >
              {tag}
            </span>
          )}

          {/* Title */}
          <h2
            className={`
              font-display
              font-bold
              text-text-primary
              letter-spacing-tight
              text-4xl md:text-5xl lg:text-6xl
              leading-tight
              mb-4
            `}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={`
                text-text-secondary
                font-body
                leading-relaxed
                text-lg
              `}
            >
              {description}
            </p>
          )}
        </div>

        {/* Steps Timeline */}
        <div
          className={`
            flex flex-col lg:flex-row
            gap-8 lg:gap-0
            max-w-5xl
            ${marginAuto}
          `}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                flex-1
                relative
                ${index < steps.length - 1 && showConnectors ? 'lg:pb-12' : ''}
              `}
            >
              {/* Step Number/Icon Container */}
              <div
                className={`
                  flex flex-col items-center mb-6
                  ${align === 'center' ? '' : 'lg:items-start'}
                `}
              >
                {/* Circle with Number or Icon */}
                <div
                  className={`
                    relative
                    w-16 h-16 md:w-20 md:h-20
                    bg-accent-500
                    rounded-full
                    flex items-center justify-center
                    text-white
                    font-bold
                    text-2xl md:text-3xl
                    shadow-lg
                    mb-6
                    flex-shrink-0
                  `}
                >
                  {step.icon ? (
                    <div className="text-white">{step.icon}</div>
                  ) : (
                    <span>{(step.number ?? index) + 1}</span>
                  )}

                  {/* Connector Line (vertical on mobile, horizontal on desktop) */}
                  {index < steps.length - 1 && showConnectors && (
                    <>
                      {/* Mobile Vertical Connector */}
                      <div
                        className={`
                          absolute
                          lg:hidden
                          left-1/2
                          top-full
                          w-0.5
                          h-12
                          bg-border-subtle
                          transform -translate-x-1/2
                        `}
                      />

                      {/* Desktop Horizontal Connector */}
                      <div
                        className={`
                          hidden lg:block
                          absolute
                          top-1/2
                          left-full
                          w-full
                          h-0.5
                          bg-border-subtle
                          transform -translate-y-1/2
                          z-0
                        `}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Step Content */}
              <div
                className={`
                  text-center
                  ${align === 'center' ? '' : 'lg:text-left'}
                `}
              >
                <h3
                  className={`
                    text-xl md:text-2xl
                    font-bold
                    text-text-primary
                    mb-2
                  `}
                >
                  {step.title}
                </h3>

                <p
                  className={`
                    text-text-secondary
                    font-body
                    leading-relaxed
                    text-sm md:text-base
                    max-w-xs
                    ${align === 'center' ? 'mx-auto' : ''}
                  `}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

HowItWorksSteps.displayName = 'HowItWorksSteps';

export default HowItWorksSteps;
