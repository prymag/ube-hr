import api from '../../services/axios';
import type { Team, TeamMember } from './team.types';

export const getTeams = async () => {
  const r = await api.get<Team[]>('/api/teams');
  return r.data;
};

export const getTeam = async (id: number) => {
  const r = await api.get<Team>(`/api/teams/${id}`);
  return r.data;
};

export const createTeam = async (data: { name: string; description?: string }) => {
  const r = await api.post<Team>('/api/teams', data);
  return r.data;
};

export const updateTeam = async (id: number, data: { name?: string; description?: string }) => {
  const r = await api.patch<Team>(`/api/teams/${id}`, data);
  return r.data;
};

export const deleteTeam = (id: number) => api.delete(`/api/teams/${id}`);

export const getTeamMembers = async (teamId: number) => {
  const r = await api.get<TeamMember[]>(`/api/teams/${teamId}/users`);
  return r.data;
};

export const addTeamMember = (teamId: number, userId: number) =>
  api.post(`/api/teams/${teamId}/users`, { userId });

export const removeTeamMember = (teamId: number, userId: number) =>
  api.delete(`/api/teams/${teamId}/users/${userId}`);
