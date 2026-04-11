export interface Team {
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
