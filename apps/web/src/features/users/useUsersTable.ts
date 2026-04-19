import { useState, useEffect, useMemo } from 'react';
import type { UsersListParams } from '@ube-hr/shared';

export type UserSortField = 'name' | 'email' | 'role' | 'status' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export function useUsersTable() {
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilterRaw] = useState('');
  const [statusFilter, setStatusFilterRaw] = useState('');
  const [sortField, setSortField] = useState<UserSortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search input to avoid a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const setRoleFilter = (v: string) => {
    setRoleFilterRaw(v);
    setPage(1);
  };
  const setStatusFilter = (v: string) => {
    setStatusFilterRaw(v);
    setPage(1);
  };

  function toggleSort(field: UserSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  const params = useMemo<UsersListParams>(
    () => ({
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      sortField,
      sortDir,
      page,
      pageSize,
    }),
    [search, roleFilter, statusFilter, sortField, sortDir, page, pageSize],
  );

  return {
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
    pageSize,
    params,
  };
}
