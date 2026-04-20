import { useState, useEffect, useMemo } from 'react';
import type { PositionsListParams } from '@ube-hr/shared';

export type PositionSortField = 'name' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export function usePositionsTable() {
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<PositionSortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  function toggleSort(field: PositionSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  const params = useMemo<PositionsListParams>(
    () => ({
      ...(search ? { search } : {}),
      sortField,
      sortDir,
      page,
      pageSize,
    }),
    [search, sortField, sortDir, page, pageSize],
  );

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
