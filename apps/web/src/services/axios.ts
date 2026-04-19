import axios from 'axios';

const api = axios.create({ withCredentials: true });

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Queue of requests waiting for a token refresh
let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token ?? '')));
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        '/api/auth/refresh',
        {},
        { withCredentials: true },
      );
      setAccessToken(data.access_token);
      processQueue(null, data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      setAccessToken(null);
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
