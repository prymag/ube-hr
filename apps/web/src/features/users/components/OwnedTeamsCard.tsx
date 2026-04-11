import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useTeams } from '../../teams';

interface OwnedTeamsCardProps {
  userId: number;
}

export function OwnedTeamsCard({ userId }: OwnedTeamsCardProps) {
  const teamsQuery = useTeams();
  const ownedTeams = (teamsQuery.data ?? []).filter((t) => t.ownerId === userId);

  if (ownedTeams.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Owned Teams</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {ownedTeams.map((team) => (
            <li key={team.id} className="px-3 py-2 rounded-md bg-muted text-sm">
              {team.name}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
