import { useAuth } from '../store/AuthContext';
import { MyTeamsWidget } from '../features/teams';

const SHOW_MY_TEAMS_ROLES = new Set(['USER', 'MANAGER', 'ADMIN']);

export function DashboardPage() {
  const { user } = useAuth();
  const showMyTeams = user?.role && SHOW_MY_TEAMS_ROLES.has(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to UBE HR</p>
      </div>
      {showMyTeams && <MyTeamsWidget />}
    </div>
  );
}
