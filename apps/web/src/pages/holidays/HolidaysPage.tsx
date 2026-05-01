import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useHolidays,
  HolidaysTable,
  DeleteHolidayDialog,
  useHolidaysTable,
} from '../../features/holidays';
import type { PublicHolidayResponse } from '../../features/holidays';
import { Button, Input } from '@ube-hr/ui';

export function HolidaysPage() {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] =
    useState<PublicHolidayResponse | null>(null);

  const {
    sortField,
    sortDir,
    toggleSort,
    page,
    setPage,
    year,
    setYear,
    params,
  } = useHolidaysTable();

  const { data: response, isLoading } = useHolidays(params);
  const rows = response?.data ?? [];
  const total = response?.total ?? 0;
  const pageCount = response?.pageCount ?? 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Public Holidays</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} result{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/holidays/new')}>
          New holiday
        </Button>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          type="number"
          placeholder="Filter by year…"
          value={year ?? ''}
          onChange={(e) =>
            setYear(e.target.value ? Number(e.target.value) : undefined)
          }
          className="h-9 w-40"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {total === 0 && !year
            ? 'No public holidays yet. Add one to get started.'
            : 'No holidays match the current filter.'}
        </div>
      ) : (
        <HolidaysTable
          holidays={rows}
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

      <DeleteHolidayDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
