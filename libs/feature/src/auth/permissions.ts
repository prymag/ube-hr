import { Role } from '@ube-hr/backend';

export type Permission = 'impersonate' | 'manage_users' | 'manage_admins';

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.USER]:        [],
  [Role.MANAGER]:     [],
  [Role.ADMIN]:       ['impersonate', 'manage_users'],
  [Role.SUPER_ADMIN]: ['impersonate', 'manage_users', 'manage_admins'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}
