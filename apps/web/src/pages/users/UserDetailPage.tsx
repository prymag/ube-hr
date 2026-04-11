import { useParams, useNavigate } from 'react-router-dom';
import { useUsers, UserHeaderCard, OwnedTeamsCard, UserTeamsCard } from '../../features/users';
import { Button } from '@ube-hr/ui';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const usersQuery = useUsers();
  const user = usersQuery.data?.find((u) => u.id === userId);

  if (usersQuery.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <div className="text-sm text-destructive">User not found.</div>;

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/users')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Users
      </Button>

      <UserHeaderCard user={user} />
      <OwnedTeamsCard userId={userId} />
      <UserTeamsCard userId={userId} />
    </div>
  );
}
