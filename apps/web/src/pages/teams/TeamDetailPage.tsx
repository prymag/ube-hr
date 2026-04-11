import { useParams, useNavigate } from 'react-router-dom';
import { useTeam, TeamHeaderCard, TeamMembersCard } from '../../features/teams';
import { useUsers } from '../../features/users';
import { Button } from '@ube-hr/ui';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);

  const teamQuery = useTeam(teamId);
  const usersQuery = useUsers();

  const team = teamQuery.data;
  const allUsers = usersQuery.data ?? [];

  const isLoading = teamQuery.isLoading || usersQuery.isLoading;

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (teamQuery.isError) return <div className="text-sm text-destructive">Team not found.</div>;
  if (!team) return null;

  const owner = allUsers.find((u) => u.id === team.ownerId);

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/teams')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Teams
      </Button>

      <TeamHeaderCard team={team} ownerName={owner?.name ?? owner?.email} />
      <TeamMembersCard teamId={teamId} />
    </div>
  );
}
