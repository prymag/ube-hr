import { useEffect, useState } from 'react';
import {
  getUsers,
  getUserTeams,
  getTeams,
  createUser,
  addTeamMember,
  removeTeamMember,
  User,
  UserTeam,
  Team,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ROLE_RANK: Record<string, number> = {
  USER: 0,
  MANAGER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const ALL_ROLES = ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  USER: 'bg-gray-100 text-gray-600',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

interface CreateForm {
  email: string;
  password: string;
  name: string;
  role: string;
}

const EMPTY_FORM: CreateForm = { email: '', password: '', name: '', role: 'USER' };

export function UsersPage() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [addTeamId, setAddTeamId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  useEffect(() => {
    Promise.all([getUsers(), getTeams()])
      .then(([u, t]) => {
        setUsers(u);
        setAllTeams(t);
      })
      .finally(() => setLoading(false));
  }, []);

  async function selectUser(user: User) {
    setSelectedUser(user);
    setAddTeamId('');
    setError('');
    setPanelLoading(true);
    try {
      const teams = await getUserTeams(user.id);
      setUserTeams(teams);
    } finally {
      setPanelLoading(false);
    }
  }

  async function handleAddToTeam() {
    if (!selectedUser || !addTeamId) return;
    setSaving(true);
    setError('');
    try {
      await addTeamMember(Number(addTeamId), selectedUser.id);
      const teams = await getUserTeams(selectedUser.id);
      setUserTeams(teams);
      setAddTeamId('');
    } catch {
      setError('Failed to add user to team. They may already be a member.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveFromTeam(teamId: number) {
    if (!selectedUser) return;
    setSaving(true);
    setError('');
    try {
      await removeTeamMember(teamId, selectedUser.id);
      setUserTeams((prev) => prev.filter((t) => t.id !== teamId));
    } catch {
      setError('Failed to remove user from team.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const created = await createUser({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
        role: form.role,
      });
      setUsers((prev) => [created, ...prev]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, role: assignableRoles[0] ?? 'USER' });
    setFormError('');
    setShowCreate(true);
  }

  const memberTeamIds = new Set(userTeams.map((t) => t.id));
  const availableTeams = allTeams.filter((t) => !memberTeamIds.has(t.id));

  if (loading) {
    return <div className="text-sm text-gray-500">Loading users…</div>;
  }

  return (
    <div className="flex gap-6 h-full">
      {/* User list */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            New User
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Name / Email</th>
                <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors last:border-0 ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{user.name ?? '—'}</div>
                    <div className="text-gray-400 text-xs">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        ROLE_BADGE[user.role] ?? ROLE_BADGE.USER
                      }`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side panel */}
      {selectedUser && (
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">{selectedUser.name ?? selectedUser.email}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Teams</h3>

            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

            {panelLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : userTeams.length === 0 ? (
              <p className="text-sm text-gray-400 mb-3">Not in any team.</p>
            ) : (
              <ul className="space-y-1 mb-3">
                {userTeams.map((team) => (
                  <li
                    key={team.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{team.name}</span>
                    <button
                      onClick={() => handleRemoveFromTeam(team.id)}
                      disabled={saving}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {availableTeams.length > 0 && (
              <div className="flex gap-2 mt-3">
                <select
                  value={addTeamId}
                  onChange={(e) => setAddTeamId(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Add to team…</option>
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddToTeam}
                  disabled={!addTeamId || saving}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">New User</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {creating ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
