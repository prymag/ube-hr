import axios from 'axios';

export const loginUser = (email: string, password: string) =>
  axios
    .post<{ access_token: string }>('/api/auth/login', { email, password }, { withCredentials: true })
    .then((r) => r.data);
