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
  end?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [{ to: '/dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Organization',
    items: [
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
    ],
  },
  {
    label: 'Leave',
    items: [
      {
        to: '/leaves',
        label: 'My Leaves',
        permission: PERMISSIONS.LEAVES_READ,
        end: true,
      },
      {
        to: '/leaves/approvals',
        label: 'Approval Queue',
        permission: PERMISSIONS.LEAVES_APPROVE,
      },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        to: '/admin/holidays',
        label: 'Holidays',
        permission: PERMISSIONS.HOLIDAYS_MANAGE,
      },
      {
        to: '/admin/leave-balance',
        label: 'Leave Balances',
        permission: PERMISSIONS.LEAVES_BALANCE_MANAGE,
      },
    ],
  },
];

export function AuthLayout() {
  const { user, setToken } = useAuth();
  const navigate = useNavigate();
  const { data: me } = useMe();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        ({ permission }) =>
          !permission || (me?.permissions?.includes(permission) ?? false),
      ),
    }))
    .filter((group) => group.items.length > 0);

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
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {visibleGroups.map((group, i) => (
            <div key={i}>
              {group.label && (
                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
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
              </div>
            </div>
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
