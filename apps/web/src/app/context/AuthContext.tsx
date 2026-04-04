import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { setAccessToken } from '../lib/axios';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  impersonatedBy?: number;
}

interface AuthContextType {
  accessToken: string | null;
  user: AuthUser | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
}

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return { id: decoded.sub, email: decoded.email, role: decoded.role, impersonatedBy: decoded.impersonatedBy };
  } catch {
    return null;
  }
}

type ChannelMessage =
  | { type: 'TOKEN_READY'; token: string }
  | { type: 'REQUEST_TOKEN' };

const CHANNEL_NAME = 'ube_hr_auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function setToken(token: string | null) {
    setAccessToken(token);
    setAccessTokenState(token);
    setUser(token ? decodeJwt(token) : null);
  }

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    let settled = false;

    function resolve(token: string | null) {
      if (settled) return;
      settled = true;
      setToken(token);
      setIsLoading(false);
    }

    // Listen for a token broadcast from another tab
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      if (e.data.type === 'TOKEN_READY') {
        resolve(e.data.token);
      }

      // Another tab is asking for the token — share it if we have one
      if (e.data.type === 'REQUEST_TOKEN' && accessToken) {
        channel.postMessage({ type: 'TOKEN_READY', token: accessToken } satisfies ChannelMessage);
      }
    };

    // Ask other tabs if they already have a token
    channel.postMessage({ type: 'REQUEST_TOKEN' } satisfies ChannelMessage);

    // Give other tabs a short window to respond before falling back to /refresh
    const timeout = setTimeout(() => {
      if (settled) return;
      axios
        .post('/api/auth/refresh', {}, { withCredentials: true })
        .then(({ data }) => {
          channel.postMessage({ type: 'TOKEN_READY', token: data.access_token } satisfies ChannelMessage);
          resolve(data.access_token);
        })
        .catch(() => resolve(null))
        .finally(() => channel.close());
    }, 150);

    return () => {
      clearTimeout(timeout);
      channel.close();
    };
  }, []);

  // Share token with new tabs that ask for it
  useEffect(() => {
    if (!accessToken) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      if (e.data.type === 'REQUEST_TOKEN') {
        channel.postMessage({ type: 'TOKEN_READY', token: accessToken } satisfies ChannelMessage);
      }
    };
    return () => channel.close();
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, user, setToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
