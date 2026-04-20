import { useState, useEffect, useMemo } from 'react';
import type { DepartmentsListParams } from '@ube-hr/shared';

export type DepartmentSortField = 'name' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export function useDepartmentsTable() {
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<DepartmentSortField>('name');
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

  function toggleSort(field: DepartmentSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  const params = useMemo<DepartmentsListParams>(
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
