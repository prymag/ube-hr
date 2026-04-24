import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PositionResponse } from '@ube-hr/shared';
import type { PositionSortField, SortDir } from '../usePositionsTable';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ube-hr/ui';

interface PositionsTableProps {
  positions: PositionResponse[];
  onDeleteRequest: (pos: PositionResponse) => void;
  sortField: PositionSortField;
  sortDir: SortDir;
  onSort: (field: PositionSortField) => void;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: PositionSortField;
  sortField: PositionSortField;
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

export function PositionsTable({
  positions,
  onDeleteRequest,
  sortField,
  sortDir,
  onSort,
}: PositionsTableProps) {
  const navigate = useNavigate();

  const th = (field: PositionSortField, label: string) => (
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
            {th('name', 'Title')}
            <TableHead>Description</TableHead>
            <TableHead>Reports To</TableHead>
            {th('createdAt', 'Created')}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((pos) => (
            <TableRow
              key={pos.id}
              onClick={() => navigate(`/positions/${pos.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="font-medium">{pos.name}</div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {pos.description ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {pos.reportsToName ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(pos.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(pos);
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
