import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { Button } from '@ube-hr/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';
import { useTeams } from '../../teams';
import { useUserTeams, useAddUserToTeam, useRemoveUserFromTeam } from '../users.queries';

interface UserTeamsCardProps {
  userId: number;
}

export function UserTeamsCard({ userId }: UserTeamsCardProps) {
  const teamsQuery = useTeams();
  const userTeamsQuery = useUserTeams(userId);
  const addToTeam = useAddUserToTeam(userId);
  const removeFromTeam = useRemoveUserFromTeam(userId);

  const [addTeamId, setAddTeamId] = useState('');

  const allTeams = teamsQuery.data ?? [];
  const userTeams = userTeamsQuery.data ?? [];

  const memberTeamIds = new Set(userTeams.map((t) => t.id));
  const availableTeams = allTeams.filter((t) => !memberTeamIds.has(t.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Teams <span className="text-muted-foreground font-normal">({userTeams.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableTeams.length > 0 && (
          <div className="flex gap-2">
            <Select value={addTeamId} onValueChange={setAddTeamId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add to team…" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (!addTeamId) return;
                addToTeam.mutate(Number(addTeamId), { onSuccess: () => setAddTeamId('') });
              }}
              disabled={!addTeamId || addToTeam.isPending}
            >
              {addToTeam.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        )}

        {addToTeam.isError && (
          <p className="text-xs text-destructive">
            Failed to add user to team. They may already be a member.
          </p>
        )}
        {removeFromTeam.isError && (
          <p className="text-xs text-destructive">Failed to remove user from team.</p>
        )}

        {userTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Not in any team.</p>
        ) : (
          <ul className="space-y-1">
            {userTeams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted"
              >
                <span className="text-sm">{team.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromTeam.mutate(team.id)}
                  disabled={removeFromTeam.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
