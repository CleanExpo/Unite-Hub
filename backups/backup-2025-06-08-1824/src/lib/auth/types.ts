// ================================================
// Authentication Type Definitions
// ================================================

export type UserRole = 'Master' | 'Admin' | 'Manager' | 'User';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  loginCount?: number;
  createdBy?: string;
  metadata?: Record<string, any>;
  fullName?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
  session?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface Permission {
  id: string;
  userId: string;
  permissionLevel: 'read' | 'write' | 'delete' | 'admin' | 'super_admin';
  resourceType: string;
  resourceId?: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  notes?: string;
}

export interface RolePermission {
  role: UserRole;
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canAdmin: boolean;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actionType: 'grant' | 'revoke' | 'modify' | 'login' | 'logout' | 'failed_login';
  targetUserId?: string;
  targetUserEmail?: string;
  performedById?: string;
  performedByEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export interface SessionData {
  user: User;
  permissions: Permission[];
  expiresAt: Date;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Module types for permissions
export type ModuleType = 'users' | 'crm' | 'analytics' | 'settings' | 'billing';

// Permission check helper type
export interface PermissionCheck {
  module: ModuleType;
  action: 'read' | 'write' | 'delete' | 'admin';
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkPermission: (check: PermissionCheck) => boolean;
  refreshSession: () => Promise<void>;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    version: string;
  };
}

// User creation/update types
export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateUserInput {
  id: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Permission management types
export interface GrantPermissionInput {
  userId: string;
  permissionLevel: Permission['permissionLevel'];
  resourceType: string;
  resourceId?: string;
  expiresAt?: Date;
  notes?: string;
}

export interface RevokePermissionInput {
  userId: string;
  permissionLevel: Permission['permissionLevel'];
  resourceType: string;
  resourceId?: string;
}

// Constants
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  Master: 4,
  Admin: 3,
  Manager: 2,
  User: 1,
};

export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermission[]> = {
  Master: [
    { role: 'Master', module: 'users', canRead: true, canWrite: true, canDelete: true, canAdmin: true },
    { role: 'Master', module: 'crm', canRead: true, canWrite: true, canDelete: true, canAdmin: true },
    { role: 'Master', module: 'analytics', canRead: true, canWrite: true, canDelete: true, canAdmin: true },
    { role: 'Master', module: 'settings', canRead: true, canWrite: true, canDelete: true, canAdmin: true },
    { role: 'Master', module: 'billing', canRead: true, canWrite: true, canDelete: true, canAdmin: true },
  ],
  Admin: [
    { role: 'Admin', module: 'users', canRead: true, canWrite: true, canDelete: true, canAdmin: false },
    { role: 'Admin', module: 'crm', canRead: true, canWrite: true, canDelete: true, canAdmin: true },
    { role: 'Admin', module: 'analytics', canRead: true, canWrite: true, canDelete: false, canAdmin: false },
    { role: 'Admin', module: 'settings', canRead: true, canWrite: true, canDelete: false, canAdmin: false },
    { role: 'Admin', module: 'billing', canRead: true, canWrite: false, canDelete: false, canAdmin: false },
  ],
  Manager: [
    { role: 'Manager', module: 'users', canRead: true, canWrite: false, canDelete: false, canAdmin: false },
    { role: 'Manager', module: 'crm', canRead: true, canWrite: true, canDelete: false, canAdmin: false },
    { role: 'Manager', module: 'analytics', canRead: true, canWrite: false, canDelete: false, canAdmin: false },
    { role: 'Manager', module: 'settings', canRead: true, canWrite: false, canDelete: false, canAdmin: false },
    { role: 'Manager', module: 'billing', canRead: false, canWrite: false, canDelete: false, canAdmin: false },
  ],
  User: [
    { role: 'User', module: 'users', canRead: false, canWrite: false, canDelete: false, canAdmin: false },
    { role: 'User', module: 'crm', canRead: true, canWrite: true, canDelete: false, canAdmin: false },
    { role: 'User', module: 'analytics', canRead: true, canWrite: false, canDelete: false, canAdmin: false },
    { role: 'User', module: 'settings', canRead: false, canWrite: false, canDelete: false, canAdmin: false },
    { role: 'User', module: 'billing', canRead: false, canWrite: false, canDelete: false, canAdmin: false },
  ],
};

// Error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH001',
  USER_NOT_FOUND: 'AUTH002',
  USER_INACTIVE: 'AUTH003',
  SESSION_EXPIRED: 'AUTH004',
  INSUFFICIENT_PERMISSIONS: 'AUTH005',
  INVALID_TOKEN: 'AUTH006',
  NETWORK_ERROR: 'AUTH007',
  SERVER_ERROR: 'AUTH008',
  RATE_LIMIT_EXCEEDED: 'AUTH009',
  INVALID_INPUT: 'AUTH010',
} as const;

// Type guards
export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    ['Master', 'Admin', 'Manager', 'User'].includes(obj.role) &&
    typeof obj.isActive === 'boolean'
  );
}

export function isAuthResponse(obj: any): obj is AuthResponse {
  return (
    obj &&
    (obj.user === null || isUser(obj.user)) &&
    (obj.error === null || typeof obj.error === 'string')
  );
}

export function hasRole(user: User | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

export function hasHigherRole(user: User | null, targetRole: UserRole): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[targetRole];
}
