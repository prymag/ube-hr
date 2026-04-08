import api from '../../services/axios';
import type { Team, TeamMember } from './team.types';

export const getTeams = () => api.get<Team[]>('/api/teams').then((r) => r.data);
export const getTeam = (id: number) => api.get<Team>(`/api/teams/${id}`).then((r) => r.data);
export const createTeam = (data: { name: string; description?: string }) =>
  api.post<Team>('/api/teams', data).then((r) => r.data);
export const updateTeam = (id: number, data: { name?: string; description?: string }) =>
  api.patch<Team>(`/api/teams/${id}`, data).then((r) => r.data);
export const deleteTeam = (id: number) => api.delete(`/api/teams/${id}`);

export const getTeamMembers = (teamId: number) =>
  api.get<TeamMember[]>(`/api/teams/${teamId}/users`).then((r) => r.data);
export const addTeamMember = (teamId: number, userId: number) =>
  api.post(`/api/teams/${teamId}/users`, { userId });
export const removeTeamMember = (teamId: number, userId: number) =>
  api.delete(`/api/teams/${teamId}/users/${userId}`);
