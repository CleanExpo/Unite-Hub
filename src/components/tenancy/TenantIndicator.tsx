'use client';

import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import type { TenantContext } from '@/lib/tenancy';

interface TenantIndicatorProps {
  context: TenantContext | null;
  showRole?: boolean;
}

export function TenantIndicator({ context, showRole = true }: TenantIndicatorProps) {
  if (!context) {
    return null;
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-500',
      manager: 'bg-blue-500',
      staff: 'bg-green-500',
      client: 'bg-gray-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{context.tenantName}</span>
      {showRole && (
        <Badge className={`${getRoleBadge(context.role)} text-xs`}>
          {context.role}
        </Badge>
      )}
    </div>
  );
}
