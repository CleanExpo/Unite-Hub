export type Role = {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Permission = {
  id: number
  name: string
  description: string | null
  resource: string
  action: string
  created_at: string
  updated_at: string
}

export type RolePermission = {
  id: number
  role_id: number
  permission_id: number
  created_at: string
}

export type UserRole = {
  id: number
  user_id: string
  role_id: number
  created_at: string
}

export type RoleWithPermissions = Role & {
  permissions: Permission[]
}

export type UserWithRoles = {
  id: string
  email: string
  roles: Role[]
}
