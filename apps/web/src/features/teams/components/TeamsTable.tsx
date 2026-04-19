import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TeamResponse } from '@ube-hr/shared';
import type { TeamSortField, SortDir } from '../useTeamsTable';
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
  teams: TeamResponse[];
  onDeleteRequest: (team: TeamResponse) => void;
  sortField: TeamSortField;
  sortDir: SortDir;
  onSort: (field: TeamSortField) => void;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: TeamSortField;
  sortField: TeamSortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
  return sortDir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  );
}

export function TeamsTable({
  teams,
  onDeleteRequest,
  sortField,
  sortDir,
  onSort,
}: TeamsTableProps) {
  const navigate = useNavigate();

  const th = (field: TeamSortField, label: string) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </TableHead>
  );

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {th('name', 'Name')}
            <TableHead>Description</TableHead>
            {th('createdAt', 'Created')}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(team);
                  }}
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
