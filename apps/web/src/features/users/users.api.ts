import api from '../../services/axios';
import type {
  UserResponse,
  UserTeam,
  UsersListParams,
  PaginatedResponse,
} from '@ube-hr/shared';

export const getUsers = async (params?: UsersListParams) => {
  const r = await api.get<PaginatedResponse<UserResponse>>('/api/users', {
    params,
  });
  return r.data;
};

export const getUser = async (id: number) => {
  const r = await api.get<UserResponse>(`/api/users/${id}`);
  return r.data;
};

export const getUserTeams = async (id: number) => {
  const r = await api.get<UserTeam[]>(`/api/users/${id}/teams`);
  return r.data;
};

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  role?: string;
}) => {
  const r = await api.post<UserResponse>('/api/users', data);
  return r.data;
};

export const updateUser = async (
  id: number,
  data: { name?: string; role?: string },
) => {
  const r = await api.patch<UserResponse>(`/api/users/${id}`, data);
  return r.data;
};

export const deleteUser = (id: number) => api.delete(`/api/users/${id}`);

export const uploadUserProfilePicture = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const r = await api.post<string>(
    `/api/users/${id}/profile-picture`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return r.data;
};

export const removeUserProfilePicture = async (id: number) => {
  await api.delete(`/api/users/${id}/profile-picture`);
};
