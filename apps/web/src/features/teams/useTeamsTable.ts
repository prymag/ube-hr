import { useState, useEffect, useMemo } from 'react';
import type { TeamsListParams } from '@ube-hr/shared';

export type TeamSortField = 'name' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export function useTeamsTable() {
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<TeamSortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
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

  function toggleSort(field: TeamSortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  const params = useMemo<TeamsListParams>(() => ({
    ...(search ? { search } : {}),
    sortField,
    sortDir,
    page,
    pageSize,
  }), [search, sortField, sortDir, page, pageSize]);

  return {
    rawSearch,
    setRawSearch,
    sortField,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    params,
  };
}
