import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useLeaveApprovals,
  useMyApprovalHistory,
  LeaveStatusBadge,
} from '../../features/leaves';
import type { LeaveApprovalHistoryItem } from '../../features/leaves';
import { Badge, Button } from '@ube-hr/ui';
import type { LeaveRequestsListParams } from '@ube-hr/shared';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
  UNPAID: 'Unpaid',
  MATERNITY: 'Maternity',
  PATERNITY: 'Paternity',
  BEREAVEMENT: 'Bereavement',
  OTHER: 'Other',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DecisionBadge({ decision }: { decision: 'APPROVED' | 'REJECTED' }) {
  return (
    <Badge variant={decision === 'APPROVED' ? 'default' : 'destructive'}>
      {decision === 'APPROVED' ? 'Approved' : 'Rejected'}
    </Badge>
  );
}

function PaginationControls({
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t text-sm text-muted-foreground">
      <span>
        Page {page} of {pageCount}
      </span>
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={page >= pageCount}
      >
        Next
      </Button>
    </div>
  );
}

function PendingTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const params: LeaveRequestsListParams = { page, pageSize: 10 };
  const { data: response, isLoading } = useLeaveApprovals(params);
  const rows = response?.data ?? [];
  const pageCount = response?.pageCount ?? 1;

  if (isLoading) return <div className="text-sm text-muted-foreground py-8">Loading…</div>;
  if (rows.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">No leave requests pending your approval.</div>;

  return (
    <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Period
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Days
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.userName ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {LEAVE_TYPE_LABELS[row.leaveType] ?? row.leaveType}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(row.startDate)}
                    {row.startDate !== row.endDate && (
                      <> – {formatDate(row.endDate)}</>
                    )}
                    {row.isHalfDay && (
                      <span className="ml-1 text-xs">({row.halfDayPeriod})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.durationDays} day{row.durationDays !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <LeaveStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/leaves/${row.id}`)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageCount={pageCount}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
    </div>
  );
}

function HistoryTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const params: LeaveRequestsListParams = { page, pageSize: 10 };
  const { data: response, isLoading } = useMyApprovalHistory(params);
  const rows = (response?.data ?? []) as LeaveApprovalHistoryItem[];
  const pageCount = response?.pageCount ?? 1;

  if (isLoading) return <div className="text-sm text-muted-foreground py-8">Loading…</div>;
  if (rows.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">No approval history yet.</div>;

  return (
    <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Period
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Days
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  My Decision
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Final Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Decided At
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/leaves/${row.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.userName ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {LEAVE_TYPE_LABELS[row.leaveType] ?? row.leaveType}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(row.startDate)}
                    {row.startDate !== row.endDate && (
                      <> – {formatDate(row.endDate)}</>
                    )}
                    {row.isHalfDay && (
                      <span className="ml-1 text-xs">({row.halfDayPeriod})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.durationDays} day{row.durationDays !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <DecisionBadge decision={row.myDecision} />
                  </td>
                  <td className="px-4 py-3">
                    <LeaveStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.myDecidedAt ? formatDateTime(row.myDecidedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageCount={pageCount}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
    </div>
  );
}

type Tab = 'pending' | 'history';

export function ApprovalQueuePage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const { data: pendingResponse } = useLeaveApprovals({ page: 1, pageSize: 10 });
  const pendingTotal = pendingResponse?.total ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pendingTotal} pending request{pendingTotal !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {(['pending', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'border-b-2 border-primary text-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab === 'pending' ? 'Pending' : 'History'}
          </button>
        ))}
      </div>

      {activeTab === 'pending' ? <PendingTab /> : <HistoryTab />}
    </div>
  );
}
