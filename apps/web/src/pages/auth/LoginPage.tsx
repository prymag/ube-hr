import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ube-hr/ui';
import { useLogin, useAuth, LoginForm } from '../../features/authentication';

export function LoginPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setToken(data.access_token);
          navigate('/dashboard');
        },
        onError: (err) => {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            setError('Invalid email or password.');
          } else {
            setError('Something went wrong. Please try again.');
          }
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Welcome back to UBE HR</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            email={email}
            password={password}
            error={error}
            isPending={login.isPending}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
