import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useMyTeams } from '../teams.queries';

export function TeamSummaryWidget() {
  const { data: teams, isLoading } = useMyTeams();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">My Teams</h2>
      {(!teams || teams.length === 0) ? (
        <p className="text-sm text-muted-foreground">You are not in any team yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{team.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
