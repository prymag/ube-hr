import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserResponse } from '@ube-hr/shared';
import type { UserSortField, SortDir } from '../useUsersTable';
import { ROLE_RANK, ROLE_BADGE, STATUS_BADGE } from '../../../config/roles';
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

interface UsersTableProps {
  users: UserResponse[];
  callerRank: number;
  onDeleteRequest: (user: UserResponse) => void;
  sortField: UserSortField;
  sortDir: SortDir;
  onSort: (field: UserSortField) => void;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: UserSortField;
  sortField: UserSortField;
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

export function UsersTable({
  users,
  callerRank,
  onDeleteRequest,
  sortField,
  sortDir,
  onSort,
}: UsersTableProps) {
  const navigate = useNavigate();

  const th = (field: UserSortField, label: string) => (
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
            {th('email', 'Email')}
            {th('role', 'Role')}
            {th('status', 'Status')}
            {th('createdAt', 'Joined')}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              onClick={() => navigate(`/users/${user.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="font-medium">{user.name ?? '—'}</div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.email}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.USER}`}
                >
                  {user.role.replace('_', ' ')}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE}`}
                >
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                {(callerRank >= ROLE_RANK['SUPER_ADMIN'] ||
                  callerRank > ROLE_RANK[user.role]) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(user);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
