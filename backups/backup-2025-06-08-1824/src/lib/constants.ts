// Application-wide constants

// Default Currency
export const DEFAULT_CURRENCY = 'AUD';
export const DEFAULT_CURRENCY_SYMBOL = 'A$';
export const DEFAULT_CURRENCY_NAME = 'Australian Dollar';

// Australian Time Zones
export const AUSTRALIAN_TIME_ZONES = {
  SYDNEY: 'Australia/Sydney',
  MELBOURNE: 'Australia/Melbourne',
  BRISBANE: 'Australia/Brisbane',
  PERTH: 'Australia/Perth',
  ADELAIDE: 'Australia/Adelaide',
  HOBART: 'Australia/Hobart',
  DARWIN: 'Australia/Darwin',
} as const;

// Default Time Zone (Brisbane)
export const DEFAULT_TIMEZONE = AUSTRALIAN_TIME_ZONES.BRISBANE;

// Master Developer Credentials
export const MASTER_DEVELOPER_EMAIL = 'phill.m@carsi.com.au';
export const MASTER_DEVELOPER_ROLE = 'master_developer';

// User Roles
export const USER_ROLES = {
  MASTER_DEVELOPER: 'master_developer',
  ADMIN: 'admin',
  TEAM_LEAD: 'team_lead',
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  MARKETING: 'marketing',
  VIEWER: 'viewer',
} as const;

// Role Permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.MASTER_DEVELOPER]: ['all'],
  [USER_ROLES.ADMIN]: ['manage_users', 'manage_projects', 'view_analytics', 'manage_settings'],
  [USER_ROLES.TEAM_LEAD]: ['manage_projects', 'view_analytics', 'manage_team'],
  [USER_ROLES.DEVELOPER]: ['edit_code', 'view_projects', 'manage_tasks'],
  [USER_ROLES.DESIGNER]: ['edit_designs', 'view_projects', 'manage_tasks'],
  [USER_ROLES.MARKETING]: ['manage_campaigns', 'view_analytics', 'manage_content'],
  [USER_ROLES.VIEWER]: ['view_projects', 'view_analytics'],
};

// Format currency helper
export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY_SYMBOL): string {
  return `${currency}${amount.toFixed(2)}`;
}

// Format date with timezone
export function formatDateWithTimezone(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
