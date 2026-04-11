import api from '../../services/axios';
import type { User, UserTeam } from './user.types';

export const getUsers = async () => {
  const r = await api.get<User[]>('/api/users');
  return r.data;
};

export const getUser = async (id: number) => {
  const r = await api.get<User>(`/api/users/${id}`);
  return r.data;
};

export const getUserTeams = async (id: number) => {
  const r = await api.get<UserTeam[]>(`/api/users/${id}/teams`);
  return r.data;
};

export const createUser = async (data: { email: string; password: string; name?: string; role?: string }) => {
  const r = await api.post<User>('/api/users', data);
  return r.data;
};

export const updateUser = async (id: number, data: { name?: string; role?: string }) => {
  const r = await api.patch<User>(`/api/users/${id}`, data);
  return r.data;
};

export const deleteUser = (id: number) => api.delete(`/api/users/${id}`);
