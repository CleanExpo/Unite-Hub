'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  MessageSquare,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import type { LocaleProfile } from '@/lib/compliance';

interface LocaleProfileSummaryProps {
  locale: LocaleProfile;
}

export function LocaleProfileSummary({ locale }: LocaleProfileSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {locale.localeCode} ({locale.regionSlug.toUpperCase()})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spelling */}
        <div>
          <div className="text-sm font-medium mb-1">Spelling Variant</div>
          <Badge variant="outline">{locale.spellingVariant}</Badge>
        </div>

        {/* Tone Guidelines */}
        <div>
          <div className="flex items-center gap-1 text-sm font-medium mb-2">
            <MessageSquare className="h-4 w-4" />
            Tone Guidelines
          </div>
          <div className="grid gap-2 text-sm">
            {locale.toneGuidelines.formality && (
              <div>
                <span className="text-muted-foreground">Formality:</span>{' '}
                {locale.toneGuidelines.formality}
              </div>
            )}
            {locale.toneGuidelines.directness && (
              <div>
                <span className="text-muted-foreground">Directness:</span>{' '}
                {locale.toneGuidelines.directness}
              </div>
            )}
            {locale.toneGuidelines.humor && (
              <div>
                <span className="text-muted-foreground">Humor:</span>{' '}
                {locale.toneGuidelines.humor}
              </div>
            )}
            {locale.toneGuidelines.notes && (
              <div className="text-muted-foreground text-xs mt-1">
                {locale.toneGuidelines.notes}
              </div>
            )}
          </div>
        </div>

        {/* Holiday Calendar */}
        {locale.holidayCalendar.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium mb-2">
              <Calendar className="h-4 w-4" />
              Key Dates
            </div>
            <div className="space-y-1">
              {locale.holidayCalendar.slice(0, 5).map((holiday, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{holiday.name}</span>
                  <span className="text-muted-foreground"> - {holiday.date}</span>
                  {holiday.note && (
                    <div className="text-xs text-amber-600 ml-2">
                      {holiday.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensitivity Flags */}
        {locale.sensitivityFlags.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Sensitivity Flags
            </div>
            <div className="flex flex-wrap gap-1">
              {locale.sensitivityFlags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-amber-600">
                  {flag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
