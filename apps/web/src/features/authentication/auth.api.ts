import axios from 'axios';

export const loginUser = async (email: string, password: string) => {
  const r = await axios.post<{ access_token: string }>('/api/auth/login', { email, password }, { withCredentials: true });
  return r.data;
};
