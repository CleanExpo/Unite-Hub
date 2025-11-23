'use client';

/**
 * Compliance Badge
 * Phase 63: Display compliance status indicator
 */

import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';

interface ComplianceBadgeProps {
  status: 'compliant' | 'warning' | 'non_compliant' | 'pending';
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ComplianceBadge({
  status,
  label,
  showIcon = true,
  size = 'md',
}: ComplianceBadgeProps) {
  const getConfig = () => {
    switch (status) {
      case 'compliant':
        return {
          color: 'bg-green-500',
          icon: <ShieldCheck className="h-3 w-3" />,
          text: label || 'Compliant',
        };
      case 'warning':
        return {
          color: 'bg-yellow-500',
          icon: <ShieldAlert className="h-3 w-3" />,
          text: label || 'Warning',
        };
      case 'non_compliant':
        return {
          color: 'bg-red-500',
          icon: <ShieldX className="h-3 w-3" />,
          text: label || 'Non-Compliant',
        };
      case 'pending':
        return {
          color: 'bg-gray-500',
          icon: <Shield className="h-3 w-3" />,
          text: label || 'Pending',
        };
    }
  };

  const config = getConfig();

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge className={`${config.color} ${sizeClasses[size]} gap-1`}>
      {showIcon && config.icon}
      {config.text}
    </Badge>
  );
}

export default ComplianceBadge;
