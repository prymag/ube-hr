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
