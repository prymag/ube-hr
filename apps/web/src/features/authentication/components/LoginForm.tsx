import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';

interface LoginFormProps {
  email: string;
  password: string;
  error: string;
  isPending: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email,
  password,
  error,
  isPending,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
