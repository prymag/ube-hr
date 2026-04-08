import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useTeam,
  useTeamMembers,
  useUpdateTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from '../features/teams';
import { useUsers } from '../features/users';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);

  const teamQuery = useTeam(teamId);
  const membersQuery = useTeamMembers(teamId);
  const usersQuery = useUsers();
  const updateTeam = useUpdateTeam(teamId);
  const addMember = useAddTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);

  const team = teamQuery.data;
  const members = membersQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');

  function startEdit() {
    if (!team) return;
    setEditName(team.name);
    setEditDesc(team.description ?? '');
    setEditing(true);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    updateTeam.mutate(
      { name: editName.trim(), description: editDesc.trim() || undefined },
      {
        onSuccess: () => setEditing(false),
        onError: () => setError('Failed to update team.'),
      }
    );
  }

  function handleAddMember() {
    if (!addUserId) return;
    setAddError('');
    addMember.mutate(Number(addUserId), {
      onSuccess: () => setAddUserId(''),
      onError: () => setAddError('Failed to add member. They may already be in this team.'),
    });
  }

  function handleRemoveMember(userId: number) {
    removeMember.mutate(userId, {
      onError: () => setError('Failed to remove member.'),
    });
  }

  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  const isLoading = teamQuery.isLoading || membersQuery.isLoading || usersQuery.isLoading;

  if (isLoading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (teamQuery.isError) return <div className="text-sm text-red-500">Team not found.</div>;
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
                disabled={updateTeam.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {updateTeam.isPending ? 'Saving…' : 'Save'}
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
              disabled={!addUserId || addMember.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {addMember.isPending ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}

        {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}
        {error && !editing && <p className="text-sm text-red-600 mb-3">{error}</p>}

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
