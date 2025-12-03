/**
 * RoleBadge Component
 *
 * Displays a user's role with appropriate styling and colors.
 * Can be used in profiles, team members lists, navigation, etc.
 *
 * @module RoleBadge
 */

"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Users, Eye } from 'lucide-react';
import { UserRole, getRoleDisplayName, getRoleDescription } from '@/lib/permissions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RoleBadgeProps {
  /**
   * User role to display
   */
  role: UserRole;

  /**
   * Badge size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show icon alongside role name
   */
  showIcon?: boolean;

  /**
   * Show tooltip with role description on hover
   */
  showTooltip?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * Get role-specific color classes
 */
function getRoleColorClasses(role: UserRole): string {
  const colors = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700',
    viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-border-subtle',
  };
  return colors[role];
}

/**
 * Get role-specific icon
 */
function getRoleIcon(role: UserRole): React.ReactNode {
  const iconProps = { size: 12, className: 'mr-1' };

  const icons = {
    owner: <Crown {...iconProps} />,
    admin: <Shield {...iconProps} />,
    member: <Users {...iconProps} />,
    viewer: <Eye {...iconProps} />,
  };

  return icons[role];
}

/**
 * Get size-specific classes
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  return sizes[size];
}

/**
 * RoleBadge component - displays user role with styling
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RoleBadge role="owner" />
 *
 * // With icon
 * <RoleBadge role="admin" showIcon />
 *
 * // With tooltip
 * <RoleBadge role="member" showTooltip />
 *
 * // Custom size
 * <RoleBadge role="viewer" size="lg" />
 *
 * // All features
 * <RoleBadge role="owner" size="md" showIcon showTooltip />
 * ```
 */
export function RoleBadge({
  role,
  size = 'md',
  showIcon = false,
  showTooltip = false,
  className = '',
}: RoleBadgeProps) {
  const roleName = getRoleDisplayName(role);
  const roleDescription = getRoleDescription(role);
  const colorClasses = getRoleColorClasses(role);
  const sizeClasses = getSizeClasses(size);

  const badgeContent = (
    <Badge
      variant="outline"
      className={`${colorClasses} ${sizeClasses} font-medium inline-flex items-center ${className}`}
    >
      {showIcon && getRoleIcon(role)}
      {roleName}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{roleDescription}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}

/**
 * RoleIndicator - displays role with icon and description
 * More detailed alternative to RoleBadge
 */
export function RoleIndicator({
  role,
  showDescription = false,
}: {
  role: UserRole;
  showDescription?: boolean;
}) {
  const roleName = getRoleDisplayName(role);
  const roleDescription = getRoleDescription(role);
  const colorClasses = getRoleColorClasses(role);

  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colorClasses}`}>
        {getRoleIcon(role)}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{roleName}</p>
        {showDescription && (
          <p className="text-xs text-muted-foreground mt-1">
            {roleDescription}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * CurrentUserRole - displays current user's role from AuthContext
 */
export function CurrentUserRole({
  showIcon = true,
  showTooltip = true,
  size = 'md',
}: {
  showIcon?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { useAuth } = require('@/contexts/AuthContext');
  const { currentOrganization } = useAuth();

  if (!currentOrganization) {
    return null;
  }

  return (
    <RoleBadge
      role={currentOrganization.role}
      showIcon={showIcon}
      showTooltip={showTooltip}
      size={size}
    />
  );
}
