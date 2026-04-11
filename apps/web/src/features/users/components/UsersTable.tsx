import { useNavigate } from 'react-router-dom';
import type { User } from '../user.types';
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
  users: User[];
  callerRank: number;
  onDeleteRequest: (user: User) => void;
}

export function UsersTable({ users, callerRank, onDeleteRequest }: UsersTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
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
                <div className="text-muted-foreground text-xs">{user.email}</div>
              </TableCell>
              <TableCell>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.USER}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE}`}>
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                {(callerRank >= ROLE_RANK['SUPER_ADMIN'] || callerRank > ROLE_RANK[user.role]) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDeleteRequest(user); }}
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
