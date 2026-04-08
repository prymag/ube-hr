import { useMutation } from '@tanstack/react-query';
import { loginUser } from './auth.api';

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
  });
}
