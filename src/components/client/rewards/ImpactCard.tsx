import { Card } from '@/components/ui/card';

export interface ImpactCardProps {
  label: string;
  value: number | string;
  icon: string;
  subtext?: string;
}

export function ImpactCard({ label, value, icon, subtext }: ImpactCardProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-lg transition-shadow">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-text-primary">{label}</h4>
          <span className="text-2xl">{icon}</span>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold text-accent-500">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {subtext && (
            <p className="text-xs text-text-secondary">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
