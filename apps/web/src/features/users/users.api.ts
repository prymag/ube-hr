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
  data: { name?: string; role?: string; profilePicture?: File | null },
) => {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.role) formData.append('role', data.role);
  if (data.profilePicture instanceof File) {
    formData.append('file', data.profilePicture);
  } else if (data.profilePicture === null) {
    formData.append('profilePicture', 'null');
  }

  const r = await api.patch<UserResponse>(`/api/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return r.data;
};

export const deleteUser = (id: number) => api.delete(`/api/users/${id}`);

export const requestVerificationCode = async (type: 'EMAIL' | 'PHONE') => {
  const r = await api.post<{ success: boolean }>(
    '/api/users/me/verification-code',
    { type },
  );
  return r.data;
};

export const verifyAndUpdateContact = async (data: {
  type: 'EMAIL' | 'PHONE';
  code: string;
  value: string;
}) => {
  const r = await api.patch<UserResponse>(
    '/api/users/me/verify-and-update',
    data,
  );
  return r.data;
};

export const requestVerificationCodeForUser = async (
  userId: number,
  type: 'EMAIL' | 'PHONE',
) => {
  const r = await api.post<{ success: boolean }>(
    `/api/users/${userId}/verification-code`,
    { type },
  );
  return r.data;
};

export const verifyAndUpdateContactForUser = async (
  userId: number,
  data: {
    type: 'EMAIL' | 'PHONE';
    code: string;
    value: string;
  },
) => {
  const r = await api.patch<UserResponse>(
    `/api/users/${userId}/verify-and-update`,
    data,
  );
  return r.data;
};
