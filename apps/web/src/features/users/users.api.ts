import api from '../../services/axios';
import type { User, UserTeam } from './user.types';

export const getUsers = () => api.get<User[]>('/api/users').then((r) => r.data);
export const getUser = (id: number) => api.get<User>(`/api/users/${id}`).then((r) => r.data);
export const getUserTeams = (id: number) => api.get<UserTeam[]>(`/api/users/${id}/teams`).then((r) => r.data);
export const createUser = (data: { email: string; password: string; name?: string; role?: string }) =>
  api.post<User>('/api/users', data).then((r) => r.data);
export const updateUser = (id: number, data: { name?: string; role?: string }) =>
  api.patch<User>(`/api/users/${id}`, data).then((r) => r.data);
export const deleteUser = (id: number) => api.delete(`/api/users/${id}`);
