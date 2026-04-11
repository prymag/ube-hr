import { useParams, useNavigate } from 'react-router-dom';
import { useTeam, useUpdateTeam, EditTeamForm, TeamMembersCard } from '../../features/teams';
import { useUser } from '../../features/users';
import type { EditTeamFormValues } from '../../features/teams';
import { Button, Card, CardContent } from '@ube-hr/ui';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);

  const teamQuery = useTeam(teamId);
  const updateTeam = useUpdateTeam(teamId);

  const team = teamQuery.data;
  const ownerQuery = useUser(team?.ownerId);

  if (teamQuery.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (teamQuery.isError || !team) return <div className="text-sm text-destructive">Team not found.</div>;

  const owner = ownerQuery.data;

  function handleSubmit(values: EditTeamFormValues) {
    updateTeam.mutate({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    });
  }

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

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold mb-1">Edit Team</h2>
          {owner && (
            <p className="text-xs text-muted-foreground mb-4">
              Owner: <span className="text-foreground">{owner.name ?? owner.email}</span>
            </p>
          )}
          <EditTeamForm
            team={team}
            isPending={updateTeam.isPending}
            isError={updateTeam.isError}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/teams')}
          />
        </CardContent>
      </Card>

      <TeamMembersCard teamId={teamId} />
    </div>
  );
}
