import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/users/UsersPage';
import { CreateUserPage } from '../pages/users/CreateUserPage';
import { UserDetailPage } from '../pages/users/UserDetailPage';
import { TeamsPage } from '../pages/teams/TeamsPage';
import { CreateTeamPage } from '../pages/teams/CreateTeamPage';
import { TeamDetailPage } from '../pages/teams/TeamDetailPage';
import { AuthLayout } from '../layouts/AuthLayout';

function GuestOnly() {
  const { accessToken, isLoading } = useAuth();
  if (isLoading) return null;
  return accessToken ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function RequireAuth() {
  const { accessToken, isLoading } = useAuth();
  if (isLoading) return null;
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/new" element={<CreateUserPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/new" element={<CreateTeamPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
