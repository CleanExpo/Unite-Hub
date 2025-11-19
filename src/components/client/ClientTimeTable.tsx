/**
 * Client Time Table Component - Phase 3 Step 8 Priority 2
 *
 * Displays approved time entries in a table format for clients:
 * - Read-only view
 * - Shows: date, staff, description, hours, rate, amount
 * - Clean, professional presentation
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description: string;
  date: string;
  hours: number;
  entryType: 'timer' | 'manual';
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'billed';
  approvedBy?: string;
  approvedAt?: string;
  xeroSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientTimeTableProps {
  entries: TimeEntry[];
}

export default function ClientTimeTable({ entries }: ClientTimeTableProps) {
  // Get entry type badge
  const getEntryTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'timer' ? 'default' : 'secondary'}>
        {type === 'timer' ? 'Timer' : 'Manual'}
      </Badge>
    );
  };

  // Get billable badge
  const getBillableBadge = (billable: boolean) => {
    return (
      <Badge variant={billable ? 'default' : 'outline'}>
        {billable ? 'Billable' : 'Non-Billable'}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </div>
            </TableHead>
            <TableHead className="w-[150px]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Staff Member
              </div>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours
              </div>
            </TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px]">Billable</TableHead>
            <TableHead className="w-[100px] text-right">
              <div className="flex items-center justify-end gap-2">
                <DollarSign className="w-4 h-4" />
                Rate
              </div>
            </TableHead>
            <TableHead className="w-[120px] text-right">
              <div className="flex items-center justify-end gap-2">
                <DollarSign className="w-4 h-4" />
                Amount
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No time entries found
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(entry.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(entry.date), 'EEEE')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {/* In real implementation, fetch staff name from user_profiles */}
                    Staff ID: {entry.staffId.substring(0, 8)}...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Approved {entry.approvedAt ? format(new Date(entry.approvedAt), 'MMM dd') : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <p className="text-sm line-clamp-2">{entry.description}</p>
                    {entry.taskId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Task: {entry.taskId}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{entry.hours.toFixed(2)}h</span>
                  </div>
                </TableCell>
                <TableCell>{getEntryTypeBadge(entry.entryType)}</TableCell>
                <TableCell>{getBillableBadge(entry.billable)}</TableCell>
                <TableCell className="text-right">
                  {entry.hourlyRate ? (
                    <span className="text-sm font-medium">
                      ${entry.hourlyRate.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {entry.totalAmount ? (
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">
                        ${entry.totalAmount.toFixed(2)}
                      </span>
                      {entry.xeroSynced && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Synced
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
