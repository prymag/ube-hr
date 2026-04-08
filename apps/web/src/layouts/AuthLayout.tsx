import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import { useAuth } from '../store/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/teams', label: 'Teams' },
];

export function AuthLayout() {
  const { user, setToken } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await api.post('/api/auth/logout');
    setToken(null);
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white border-r border-gray-200">
        {/* App title */}
        <div className="px-6 py-5 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-800">UBE HR</span>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
