import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePositions,
  PositionsTable,
  DeletePositionDialog,
  usePositionsTable,
} from '../../features/positions';
import type { PositionResponse } from '../../features/positions';
import { Button, Input } from '@ube-hr/ui';

export function PositionsPage() {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<PositionResponse | null>(
    null,
  );

  const {
    rawSearch,
    setRawSearch,
    sortField,
    sortDir,
    toggleSort,
    page,
    setPage,
    params,
  } = usePositionsTable();

  const { data: response, isLoading } = usePositions(params);
  const rows = response?.data ?? [];
  const total = response?.total ?? 0;
  const pageCount = response?.pageCount ?? 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Positions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} result{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/positions/new')}>New position</Button>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search by title or description…"
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          className="h-9 w-72"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {total === 0 && !rawSearch
            ? 'No positions yet. Create one to get started.'
            : 'No positions match the current search.'}
        </div>
      ) : (
        <PositionsTable
          positions={rows}
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

      <DeletePositionDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
