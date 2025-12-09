'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export interface CTASectionProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'form' | 'buttons';
  primaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  formConfig?: {
    placeholder?: string;
    buttonText?: string;
    onSubmit?: (email: string) => Promise<void> | void;
  };
  benefits?: string[];
  backgroundColor?: 'primary' | 'muted' | 'gradient';
  className?: string;
}

/**
 * CTA Section Component
 *
 * Call-to-action section with multiple variants:
 * - default: Just title/subtitle with buttons
 * - form: Email capture form
 * - buttons: Multiple action buttons
 *
 * @example
 * ```tsx
 * // Button variant
 * <CTASection
 *   title="Ready to Transform Your Marketing?"
 *   subtitle="Join thousands of businesses already using Unite-Hub"
 *   variant="buttons"
 *   primaryCTA={{ text: 'Start Free Trial', href: '/signup' }}
 *   secondaryCTA={{ text: 'Contact Sales', href: '/contact' }}
 *   benefits={['No credit card required', '14-day trial', 'Cancel anytime']}
 * />
 *
 * // Form variant
 * <CTASection
 *   title="Get Started Today"
 *   variant="form"
 *   formConfig={{
 *     placeholder: 'Enter your email',
 *     buttonText: 'Start Free Trial',
 *     onSubmit: async (email) => { ... }
 *   }}
 *   benefits={['No credit card', 'Setup in 5 minutes']}
 * />
 * ```
 */
export function CTASection({
  title,
  subtitle,
  variant = 'default',
  primaryCTA,
  secondaryCTA,
  formConfig,
  benefits,
  backgroundColor = 'primary',
  className = '',
}: CTASectionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConfig?.onSubmit || !email) {
return;
}

    setIsSubmitting(true);
    try {
      await formConfig.onSubmit(email);
      setSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgClasses = {
    primary: 'bg-primary/5 border border-primary/20',
    muted: 'bg-muted/30 border',
    gradient: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10',
  };

  return (
    <div className={`${bgClasses[backgroundColor]} rounded-lg p-8 text-center ${className}`}>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      {subtitle && (
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}

      {/* Form Variant */}
      {variant === 'form' && formConfig && (
        <div className="max-w-md mx-auto mb-6">
          {submitted ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5 inline-block mr-2" />
              Success! Check your email to get started.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder={formConfig.placeholder || 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {formConfig.buttonText || 'Submit'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Buttons Variant */}
      {variant === 'buttons' && (primaryCTA || secondaryCTA) && (
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          {primaryCTA && (
            <Button size="lg" onClick={primaryCTA.onClick} asChild>
              <a href={primaryCTA.href}>{primaryCTA.text}</a>
            </Button>
          )}
          {secondaryCTA && (
            <Button size="lg" variant="outline" onClick={secondaryCTA.onClick} asChild>
              <a href={secondaryCTA.href}>{secondaryCTA.text}</a>
            </Button>
          )}
        </div>
      )}

      {/* Default Variant */}
      {variant === 'default' && primaryCTA && (
        <div className="mb-6">
          <Button size="lg" onClick={primaryCTA.onClick} asChild>
            <a href={primaryCTA.href}>
              {primaryCTA.text} <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}

      {/* Benefits */}
      {benefits && benefits.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-muted-foreground">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
