export { PERMISSIONS, Permission, ALL_PERMISSIONS } from '@ube-hr/shared';

import { Role } from '@ube-hr/backend';

/** Rank is derived from enum declaration order in schema.prisma — insert new roles at the correct position. */
export function roleRank(role: Role): number {
  return Object.values(Role).indexOf(role);
}

/** Returns all roles with rank <= the caller's rank. */
export function visibleRoles(callerRole: Role): Role[] {
  const callerRank = roleRank(callerRole);
  return Object.values(Role).filter((r) => roleRank(r) <= callerRank);
}
