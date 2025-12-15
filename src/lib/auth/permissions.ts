import { hasPermission as hasPermissionCore } from "@/lib/core/permissionService";

export async function hasPermission(
  userId: string,
  workspaceId: string,
  resource: string,
  action: string
) {
  return hasPermissionCore(userId, workspaceId, resource, action);
}

