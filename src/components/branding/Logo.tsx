import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoVariant = 'default' | 'starter' | 'professional';

interface LogoProps {
  variant?: LogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const LOGO_PATHS = {
  default: '/logos/unite-hub-logo.png',
  starter: '/logos/unite-hub-starter.png',
  professional: '/logos/unite-hub-professional.png',
} as const;

const SIZES = {
  sm: { width: 80, height: 80 },
  md: { width: 120, height: 120 },
  lg: { width: 160, height: 160 },
  xl: { width: 200, height: 200 },
} as const;

export function Logo({
  variant = 'default',
  size = 'md',
  className,
  showText = true
}: LogoProps) {
  const dimensions = SIZES[size];
  const logoSrc = LOGO_PATHS[variant];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src={logoSrc}
        alt={`Unite-Hub ${variant === 'default' ? '' : variant} Logo`}
        width={dimensions.width}
        height={dimensions.height}
        priority
        className="object-contain"
      />
      {!showText && variant === 'default' && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-[#2563ab]">
            Unite-<span className="text-[#f39c12]">Hub</span>
          </span>
        </div>
      )}
    </div>
  );
}

// Separate text-only logo for navigation
export function LogoText({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-xl font-bold">
        <span className="text-[#2563ab]">Unite-</span>
        <span className="text-[#f39c12]">Hub</span>
      </span>
    </div>
  );
}

// Membership badge component
interface MembershipBadgeProps {
  tier: 'starter' | 'professional';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MembershipBadge({ tier, size = 'md', className }: MembershipBadgeProps) {
  const variant = tier === 'starter' ? 'starter' : 'professional';
  const dimensions = SIZES[size];

  return (
    <div className={cn('inline-flex items-center', className)}>
      <Image
        src={LOGO_PATHS[variant]}
        alt={`Unite-Hub ${tier} Member`}
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
      />
    </div>
  );
}
