export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// --- User wire types ---

export type UserRole = 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  profilePicture: string | null;
  createdAt: string;
}

export interface UserTeam {
  id: number;
  name: string;
  description: string | null;
  joinedAt: string;
}

export interface UsersListParams {
  search?: string;
  role?: string;
  status?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

// --- Team wire types ---

export interface TeamResponse {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  email: string;
  name: string | null;
  joinedAt: string;
}

export interface TeamsListParams {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

// --- Auth wire types ---

export interface MeResponse {
  id: number;
  email: string;
  role: UserRole;
  profilePicture: string | null;
  impersonatedBy?: number;
  permissions: string[];
}
