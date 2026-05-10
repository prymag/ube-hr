import { useMyProfile } from '../features/users';
import { useMe } from '../features/authentication';
import { LeaveBalanceSummary, RecentLeaves, PendingApprovalsWidget } from '../features/leaves';
import { UpcomingHolidays } from '../features/holidays';
import { TeamSummaryWidget } from '../features/teams';
import { OrgStatsCards } from '../features/stats';
import { PERMISSIONS } from '@ube-hr/shared';

export function DashboardPage() {
  const { data: profile } = useMyProfile();
  const { data: me } = useMe();

  const perms = me?.permissions ?? [];
  const canReadUsers = perms.includes(PERMISSIONS.USERS_READ);
  const canReadLeaves = perms.includes(PERMISSIONS.LEAVES_READ);
  const canApproveLeaves = perms.includes(PERMISSIONS.LEAVES_APPROVE);

  const hasDepartment = !!profile?.departmentName;
  const hasSupervisor = !!profile?.supervisorName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to UBE HR</p>
      </div>

      {(hasDepartment || hasSupervisor) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-6">
          {hasDepartment && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.departmentName}</p>
            </div>
          )}
          {hasSupervisor && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Direct Supervisor</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.supervisorName}</p>
            </div>
          )}
        </div>
      )}

      {canReadUsers && <OrgStatsCards />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingHolidays />
        {canApproveLeaves && <PendingApprovalsWidget />}
        {canReadLeaves && <LeaveBalanceSummary />}
        {canReadLeaves && <RecentLeaves />}
      </div>

      <TeamSummaryWidget />
    </div>
  );
}
