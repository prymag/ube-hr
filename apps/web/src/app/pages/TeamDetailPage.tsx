import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTeam,
  updateTeam,
  getTeamMembers,
  getUsers,
  addTeamMember,
  removeTeamMember,
  Team,
  TeamMember,
  User,
} from '../lib/api';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Add member state
  const [addUserId, setAddUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    Promise.all([getTeam(teamId), getTeamMembers(teamId), getUsers()])
      .then(([t, m, u]) => {
        setTeam(t);
        setMembers(m);
        setAllUsers(u);
      })
      .catch(() => setError('Team not found.'))
      .finally(() => setLoading(false));
  }, [teamId]);

  function startEdit() {
    if (!team) return;
    setEditName(team.name);
    setEditDesc(team.description ?? '');
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateTeam(team.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setTeam(updated);
      setEditing(false);
    } catch {
      setError('Failed to update team.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember() {
    if (!addUserId) return;
    setAddingMember(true);
    setAddError('');
    try {
      await addTeamMember(teamId, Number(addUserId));
      const updated = await getTeamMembers(teamId);
      setMembers(updated);
      setAddUserId('');
    } catch {
      setAddError('Failed to add member. They may already be in this team.');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(userId: number) {
    try {
      await removeTeamMember(teamId, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      setError('Failed to remove member.');
    }
  }

  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error && !team) return <div className="text-sm text-red-500">{error}</div>;
  if (!team) return null;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/teams')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1"
      >
        ← Back to Teams
      </button>

      {/* Team header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {editing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{team.name}</h1>
              {team.description && (
                <p className="text-sm text-gray-500 mt-1">{team.description}</p>
              )}
              {(() => {
                const owner = allUsers.find((u) => u.id === team.ownerId);
                return owner ? (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Owner: <span className="text-gray-600">{owner.name ?? owner.email}</span>
                  </p>
                ) : null;
              })()}
            </div>
            <button
              onClick={startEdit}
              className="text-sm text-blue-600 hover:text-blue-800 ml-4"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Members <span className="text-gray-400 font-normal">({members.length})</span></h2>
        </div>

        {/* Add member */}
        {availableUsers.length > 0 && (
          <div className="flex gap-2 mb-4">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Add a member…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={!addUserId || addingMember}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {addingMember ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}

        {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}

        {members.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No members yet.</p>
        ) : (
          <ul className="space-y-1">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">{member.name ?? '—'}</div>
                  <div className="text-xs text-gray-400">{member.email}</div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
