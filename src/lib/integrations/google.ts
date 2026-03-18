// src/lib/integrations/google.ts
// Barrel re-export — split into google-oauth.ts, gmail.ts, calendar.ts
// All existing importers of this path continue to work unchanged.

export * from './google-oauth'
export * from './gmail'
export * from './calendar'
