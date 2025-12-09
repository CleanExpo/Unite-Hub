'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import type { UserAgency } from '@/lib/tenancy';

interface AgencySwitcherProps {
  agencies: UserAgency[];
  currentAgencyId: string | null;
  onSwitch: (agencyId: string) => Promise<void>;
}

export function AgencySwitcher({
  agencies,
  currentAgencyId,
  onSwitch
}: AgencySwitcherProps) {
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (agencyId: string) => {
    if (agencyId === currentAgencyId) {
return;
}

    setSwitching(true);
    try {
      await onSwitch(agencyId);
    } finally {
      setSwitching(false);
    }
  };

  if (agencies.length <= 1) {
    return null;
  }

  return (
    <Select
      value={currentAgencyId || ''}
      onValueChange={handleSwitch}
      disabled={switching}
    >
      <SelectTrigger className="w-48">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue placeholder="Select agency" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {agencies.map((agency) => (
          <SelectItem
            key={agency.agencyId}
            value={agency.agencyId}
            disabled={!agency.isActive}
          >
            <div className="flex items-center justify-between w-full">
              <span>{agency.agencyName}</span>
              {!agency.isActive && (
                <span className="text-xs text-muted-foreground ml-2">
                  (inactive)
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
