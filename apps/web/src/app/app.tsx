import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { useMe } from '../features/authentication';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NoPermissionPage } from '../pages/NoPermissionPage';
import { UsersPage } from '../pages/users/UsersPage';
import { CreateUserPage } from '../pages/users/CreateUserPage';
import { UserDetailPage } from '../pages/users/UserDetailPage';
import { TeamsPage } from '../pages/teams/TeamsPage';
import { CreateTeamPage } from '../pages/teams/CreateTeamPage';
import { TeamDetailPage } from '../pages/teams/TeamDetailPage';
import { DepartmentsPage } from '../pages/departments/DepartmentsPage';
import { CreateDepartmentPage } from '../pages/departments/CreateDepartmentPage';
import { DepartmentDetailPage } from '../pages/departments/DepartmentDetailPage';
import { PositionsPage } from '../pages/positions/PositionsPage';
import { CreatePositionPage } from '../pages/positions/CreatePositionPage';
import { PositionDetailPage } from '../pages/positions/PositionDetailPage';
import { OrgChartPage } from '../pages/org-chart/OrgChartPage';
import { AuthLayout } from '../layouts/AuthLayout';
import { PERMISSIONS } from '@ube-hr/shared';

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

function RequirePermission({ permission }: { permission: string }) {
  const { data: me, isPending } = useMe();
  if (isPending) return null;
  return me?.permissions?.includes(permission) ? (
    <Outlet />
  ) : (
    <Navigate to="/no-permission" replace />
  );
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
            <Route path="/no-permission" element={<NoPermissionPage />} />
            <Route
              element={
                <RequirePermission permission={PERMISSIONS.USERS_READ} />
              }
            >
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/new" element={<CreateUserPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
            </Route>
            <Route
              element={
                <RequirePermission permission={PERMISSIONS.TEAMS_READ} />
              }
            >
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/new" element={<CreateTeamPage />} />
              <Route path="/teams/:id" element={<TeamDetailPage />} />
            </Route>
            <Route
              element={
                <RequirePermission permission={PERMISSIONS.DEPARTMENTS_READ} />
              }
            >
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route
                path="/departments/new"
                element={<CreateDepartmentPage />}
              />
              <Route
                path="/departments/:id"
                element={<DepartmentDetailPage />}
              />
            </Route>
            <Route
              element={
                <RequirePermission permission={PERMISSIONS.POSITIONS_READ} />
              }
            >
              <Route path="/positions" element={<PositionsPage />} />
              <Route path="/positions/new" element={<CreatePositionPage />} />
              <Route path="/positions/:id" element={<PositionDetailPage />} />
            </Route>
            <Route
              element={
                <RequirePermission permission={PERMISSIONS.POSITIONS_READ} />
              }
            >
              <Route path="/org-chart" element={<OrgChartPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
