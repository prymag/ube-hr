export const ROLE_RANK: Record<string, number> = {
  USER: 0,
  MANAGER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export const ALL_ROLES = ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];

export const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  USER: 'bg-gray-100 text-gray-600',
};

export const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
};
