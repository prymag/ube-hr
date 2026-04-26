import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, UsersTable, DeleteUserDialog } from '../../features/users';
import { useUsersTable } from '../../features/users/useUsersTable';
import type { UserResponse } from '../../features/users';
import { useAuth } from '../../store/AuthContext';
import { useMe } from '../../features/authentication';
import { ROLE_RANK, ALL_ROLES } from '../../config/roles';
import { PERMISSIONS } from '@ube-hr/shared';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';

export function UsersPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { data: me } = useMe();
  const canCreateUsers = me?.permissions?.includes(PERMISSIONS.USERS_CREATE) ?? false;
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const filterableRoles = ALL_ROLES.filter(
    (r) => (ROLE_RANK[r] ?? 0) <= callerRank,
  );

  const {
    rawSearch,
    setRawSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    sortField,
    sortDir,
    toggleSort,
    page,
    setPage,
    params,
  } = useUsersTable();

  const { data: response, isLoading } = useUsers(params);
  const rows = response?.data ?? [];
  const total = response?.total ?? 0;
  const pageCount = response?.pageCount ?? 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} result{total !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateUsers && (
          <Button onClick={() => navigate('/users/new')}>New User</Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Input
          placeholder="Search by name or email…"
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          className="h-9 w-64"
        />
        <Select
          value={roleFilter || 'all'}
          onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {filterableRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No users match the current filters.
        </div>
      ) : (
        <UsersTable
          users={rows}
          callerRank={callerRank}
          onDeleteRequest={setDeleteTarget}
          sortField={sortField}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <DeleteUserDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
