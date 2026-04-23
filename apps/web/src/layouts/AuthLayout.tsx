import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import { useAuth } from '../store/AuthContext';
import { useMe } from '../features/authentication';
import { Button } from '@ube-hr/ui';
import { PERMISSIONS } from '@ube-hr/shared';

interface NavItem {
  to: string;
  label: string;
  permission?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users', permission: PERMISSIONS.USERS_READ },
  { to: '/teams', label: 'Teams', permission: PERMISSIONS.TEAMS_READ },
  {
    to: '/departments',
    label: 'Departments',
    permission: PERMISSIONS.DEPARTMENTS_READ,
  },
  {
    to: '/positions',
    label: 'Positions',
    permission: PERMISSIONS.POSITIONS_READ,
  },
  {
    to: '/org-chart',
    label: 'Org Chart',
    permission: PERMISSIONS.POSITIONS_READ,
  },
];

export function AuthLayout() {
  const { user, setToken } = useAuth();
  const navigate = useNavigate();
  const { data: me } = useMe();

  const visibleNavItems = navItems.filter(
    ({ permission }) =>
      !permission || (me?.permissions?.includes(permission) ?? false),
  );

  async function handleLogout() {
    await api.post('/api/auth/logout');
    setToken(null);
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-background border-r">
        {/* App title */}
        <div className="px-6 py-5 border-b">
          <span className="text-lg font-bold">UBE HR</span>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b">
          <p className="text-sm font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {user?.role}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNavItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
