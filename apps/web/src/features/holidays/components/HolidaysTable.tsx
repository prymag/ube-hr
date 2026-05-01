import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PublicHolidayResponse } from '@ube-hr/shared';
import type { HolidaySortField, SortDir } from '../useHolidaysTable';
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

interface HolidaysTableProps {
  holidays: PublicHolidayResponse[];
  onDeleteRequest: (holiday: PublicHolidayResponse) => void;
  sortField: HolidaySortField;
  sortDir: SortDir;
  onSort: (field: HolidaySortField) => void;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: HolidaySortField;
  sortField: HolidaySortField;
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

export function HolidaysTable({
  holidays,
  onDeleteRequest,
  sortField,
  sortDir,
  onSort,
}: HolidaysTableProps) {
  const navigate = useNavigate();

  const th = (field: HolidaySortField, label: string) => (
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
            {th('date', 'Date')}
            <TableHead>Description</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holidays.map((holiday) => (
            <TableRow
              key={holiday.id}
              onClick={() => navigate(`/admin/holidays/${holiday.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="font-medium">{holiday.name}</div>
              </TableCell>
              <TableCell className="text-sm">
                {new Date(holiday.date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {holiday.description ?? '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(holiday);
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
