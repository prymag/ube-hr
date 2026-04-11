export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
}

export interface UserTeam {
  id: number;
  name: string;
  description: string | null;
  joinedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
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
