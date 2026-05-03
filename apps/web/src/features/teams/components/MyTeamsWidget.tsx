import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useMyTeams } from '../teams.queries';
import type { MyTeamResponse } from '@ube-hr/shared';

function TeamCard({ team }: { team: MyTeamResponse }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {team.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visible members.</p>
        ) : (
          <ul className="space-y-1">
            {team.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-1.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {member.name ?? '—'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {member.email}
                    {member.positionName ? ` · ${member.positionName}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function MyTeamsWidget() {
  const { data: teams, isLoading, isError } = useMyTeams();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load your teams.</p>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You are not a member of any teams yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">My Teams</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}
