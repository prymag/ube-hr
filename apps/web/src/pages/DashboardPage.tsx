import { useAuth } from '../store/AuthContext';
import { MyTeamsWidget } from '../features/teams';
import { useMyProfile } from '../features/users';

const SHOW_MY_TEAMS_ROLES = new Set(['USER', 'MANAGER', 'ADMIN']);

export function DashboardPage() {
  const { user } = useAuth();
  const showMyTeams = user?.role && SHOW_MY_TEAMS_ROLES.has(user.role);
  const { data: profile } = useMyProfile();

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

      {showMyTeams && <MyTeamsWidget />}
    </div>
  );
}
