export interface AuthUser {
  id: number;
  email: string;
  role: string;
  impersonatedBy?: number;
}

export interface AuthContextType {
  accessToken: string | null;
  user: AuthUser | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
}
