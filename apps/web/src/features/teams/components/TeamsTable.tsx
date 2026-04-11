import { useNavigate } from 'react-router-dom';
import type { Team } from '../team.types';
import { Button } from '@ube-hr/ui';
import { Card } from '@ube-hr/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ube-hr/ui';

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow
              key={team.id}
              onClick={() => navigate(`/teams/${team.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="font-medium">{team.name}</div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {team.description ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(team.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDeleteRequest(team); }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
