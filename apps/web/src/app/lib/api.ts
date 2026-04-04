import api from './axios';

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  email: string;
  name: string | null;
  joinedAt: string;
}

export interface UserTeam {
  id: number;
  name: string;
  description: string | null;
  joinedAt: string;
}

// Users
export const getUsers = () => api.get<User[]>('/api/users').then((r) => r.data);
export const getUser = (id: number) => api.get<User>(`/api/users/${id}`).then((r) => r.data);
export const getUserTeams = (id: number) => api.get<UserTeam[]>(`/api/users/${id}/teams`).then((r) => r.data);
export const createUser = (data: { email: string; password: string; name?: string; role?: string }) =>
  api.post<User>('/api/users', data).then((r) => r.data);

// Teams
export const getTeams = () => api.get<Team[]>('/api/teams').then((r) => r.data);
export const getTeam = (id: number) => api.get<Team>(`/api/teams/${id}`).then((r) => r.data);
export const createTeam = (data: { name: string; description?: string }) =>
  api.post<Team>('/api/teams', data).then((r) => r.data);
export const updateTeam = (id: number, data: { name?: string; description?: string }) =>
  api.patch<Team>(`/api/teams/${id}`, data).then((r) => r.data);
export const deleteTeam = (id: number) => api.delete(`/api/teams/${id}`);

// Membership
export const getTeamMembers = (teamId: number) =>
  api.get<TeamMember[]>(`/api/teams/${teamId}/users`).then((r) => r.data);
export const addTeamMember = (teamId: number, userId: number) =>
  api.post(`/api/teams/${teamId}/users`, { userId });
export const removeTeamMember = (teamId: number, userId: number) =>
  api.delete(`/api/teams/${teamId}/users/${userId}`);
