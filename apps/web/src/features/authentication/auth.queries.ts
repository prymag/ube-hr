import { useMutation, useQuery, skipToken } from '@tanstack/react-query';
import { loginUser, getMe } from './auth.api';
import { useAuth } from '../../store/AuthContext';

export const authKeys = {
  me: () => ['auth', 'me'] as const,
};

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
  });
}

export function useMe() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: accessToken ? getMe : skipToken,
  });
}
