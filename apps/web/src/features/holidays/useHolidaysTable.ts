import { useState, useEffect, useMemo } from 'react';
import type { PublicHolidaysListParams } from '@ube-hr/shared';

export type HolidaySortField = 'name' | 'date' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export function useHolidaysTable() {
  const [sortField, setSortField] = useState<HolidaySortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [year, setYear] = useState<number | undefined>(undefined);
  const pageSize = 10;

  // reset page when year filter changes
  useEffect(() => {
    setPage(1);
  }, [year]);

  function toggleSort(field: HolidaySortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  const params = useMemo<PublicHolidaysListParams>(
    () => ({
      ...(year ? { year } : {}),
      sortField,
      sortDir,
      page,
      pageSize,
    }),
    [year, sortField, sortDir, page, pageSize],
  );

  return {
    sortField,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    year,
    setYear,
    params,
  };
}
