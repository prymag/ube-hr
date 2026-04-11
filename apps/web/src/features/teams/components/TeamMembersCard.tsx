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
import { useUsers } from '../../users';
import { useTeamMembers, useAddTeamMember, useRemoveTeamMember } from '../teams.queries';

interface TeamMembersCardProps {
  teamId: number;
}

export function TeamMembersCard({ teamId }: TeamMembersCardProps) {
  const membersQuery = useTeamMembers(teamId);
  const usersQuery = useUsers();
  const addMember = useAddTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);

  const [addUserId, setAddUserId] = useState('');

  const members = membersQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];

  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Members <span className="text-muted-foreground font-normal">({members.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableUsers.length > 0 && (
          <div className="flex gap-2">
            <Select value={addUserId} onValueChange={setAddUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add a member…" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (!addUserId) return;
                addMember.mutate(Number(addUserId), { onSuccess: () => setAddUserId('') });
              }}
              disabled={!addUserId || addMember.isPending}
            >
              {addMember.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        )}

        {addMember.isError && (
          <p className="text-sm text-destructive">
            Failed to add member. They may already be in this team.
          </p>
        )}
        {removeMember.isError && (
          <p className="text-sm text-destructive">Failed to remove member.</p>
        )}

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No members yet.</p>
        ) : (
          <ul className="space-y-1">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted"
              >
                <div>
                  <div className="text-sm font-medium">{member.name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember.mutate(member.id)}
                  disabled={removeMember.isPending}
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
