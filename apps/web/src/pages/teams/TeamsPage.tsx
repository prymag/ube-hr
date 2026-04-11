import { useState } from 'react';
import { useTeams, TeamsTable, CreateTeamDialog, DeleteTeamDialog } from '../../features/teams';
import type { Team } from '../../features/teams';
import { Button } from '@ube-hr/ui';

export function TeamsPage() {
  const { data: teams = [], isLoading } = useTeams();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading teams…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teams.length} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>New team</Button>
      </div>

      <TeamsTable teams={teams} onDeleteRequest={setDeleteTarget} />

      <CreateTeamDialog open={showCreate} onClose={() => setShowCreate(false)} />

      <DeleteTeamDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
