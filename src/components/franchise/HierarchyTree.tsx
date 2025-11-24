'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight } from 'lucide-react';
import { TierBadge } from './TierBadge';
import type { AgencyWithLicense } from '@/lib/franchise';

interface HierarchyTreeProps {
  root: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    children?: any[];
  };
  children: AgencyWithLicense[];
  onSelect?: (agencyId: string) => void;
}

export function HierarchyTree({ root, children, onSelect }: HierarchyTreeProps) {
  return (
    <div className="space-y-4">
      {/* Root Agency */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{root.name}</h3>
              <p className="text-sm text-muted-foreground">/{root.slug}</p>
            </div>
            <Badge variant="outline">Parent</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      {children.length > 0 && (
        <div className="ml-8 space-y-2">
          {children.map((child) => (
            <Card
              key={child.agencyId}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelect?.(child.agencyId)}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.agencyName}</span>
                      {child.tierName && (
                        <TierBadge tierName={child.tierName} showIcon={false} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>/{child.agencySlug}</span>
                      {child.regionName && (
                        <>
                          <span>•</span>
                          <span>{child.regionName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {child.licenseStatus && (
                    <Badge
                      variant={child.licenseStatus === 'active' ? 'default' : 'secondary'}
                    >
                      {child.licenseStatus}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {children.length === 0 && (
        <div className="ml-8 text-sm text-muted-foreground">
          No sub-agencies yet
        </div>
      )}
    </div>
  );
}
