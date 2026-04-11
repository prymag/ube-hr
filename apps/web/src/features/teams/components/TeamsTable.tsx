import { useNavigate } from 'react-router-dom';
import type { Team } from '../team.types';
import { Button } from '@ube-hr/ui';
import { Card } from '@ube-hr/ui';

interface TeamsTableProps {
  teams: Team[];
  onDeleteRequest: (team: Team) => void;
}

export function TeamsTable({ teams, onDeleteRequest }: TeamsTableProps) {
  const navigate = useNavigate();

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No teams yet. Create one to get started.
      </div>
    );
  }

  return (
    <Card>
      {teams.map((team, i) => (
        <div
          key={team.id}
          className={`flex items-center justify-between px-5 py-4 ${
            i < teams.length - 1 ? 'border-b' : ''
          }`}
        >
          <button
            onClick={() => navigate(`/teams/${team.id}`)}
            className="flex-1 text-left group"
          >
            <div className="font-medium group-hover:text-primary transition-colors">
              {team.name}
            </div>
            {team.description && (
              <div className="text-sm text-muted-foreground mt-0.5">{team.description}</div>
            )}
          </button>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/teams/${team.id}`)}>
              Manage
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteRequest(team)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}
