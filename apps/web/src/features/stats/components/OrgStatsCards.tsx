import { useStats } from '../stats.queries';

interface StatCardProps {
  label: string;
  value: number | undefined;
  isLoading: boolean;
}

function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-8 w-16 bg-muted rounded animate-pulse" />
      ) : (
        <p className="mt-1 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      )}
    </div>
  );
}

export function OrgStatsCards() {
  const { data, isLoading } = useStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Active Users" value={data?.totalUsers} isLoading={isLoading} />
      <StatCard label="Teams" value={data?.totalTeams} isLoading={isLoading} />
      <StatCard label="Departments" value={data?.totalDepartments} isLoading={isLoading} />
      <StatCard label="Pending Leaves" value={data?.totalPendingLeaves} isLoading={isLoading} />
    </div>
  );
}
