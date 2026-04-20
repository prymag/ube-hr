import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DepartmentResponse } from '@ube-hr/shared';
import type { DepartmentSortField, SortDir } from '../useDepartmentsTable';
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

interface DepartmentsTableProps {
  departments: DepartmentResponse[];
  onDeleteRequest: (dept: DepartmentResponse) => void;
  sortField: DepartmentSortField;
  sortDir: SortDir;
  onSort: (field: DepartmentSortField) => void;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: DepartmentSortField;
  sortField: DepartmentSortField;
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

export function DepartmentsTable({
  departments,
  onDeleteRequest,
  sortField,
  sortDir,
  onSort,
}: DepartmentsTableProps) {
  const navigate = useNavigate();

  const th = (field: DepartmentSortField, label: string) => (
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
            <TableHead>Head</TableHead>
            {th('createdAt', 'Created')}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow
              key={dept.id}
              onClick={() => navigate(`/departments/${dept.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="font-medium">{dept.name}</div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {dept.description ?? '—'}
              </TableCell>
              <TableCell className="text-sm">{dept.headName ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(dept.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(dept);
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
