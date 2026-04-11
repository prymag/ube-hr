import axios from 'axios';
import api from '../../services/axios';
import type { AuthUser } from './auth.types';

export interface MeResponse extends AuthUser {
  permissions: string[];
}

export const loginUser = async (email: string, password: string) => {
  const r = await axios.post<{ access_token: string }>('/api/auth/login', { email, password }, { withCredentials: true });
  return r.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const r = await api.get<MeResponse>('/api/auth/me');
  return r.data;
};
