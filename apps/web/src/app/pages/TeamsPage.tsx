import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, createTeam, deleteTeam, Team } from '../lib/api';

export function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const team = await createTeam({ name: name.trim(), description: description.trim() || undefined });
      setTeams((prev) => [...prev, team].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setDescription('');
      setShowCreate(false);
    } catch {
      setError('Failed to create team. Name may already be taken.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(team: Team) {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    try {
      await deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
    } catch {
      setError('Failed to delete team.');
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading teams…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">{teams.length} total</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New team
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Create team</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Engineering"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What is this team for?"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No teams yet. Create one to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {teams.map((team, i) => (
            <div
              key={team.id}
              className={`flex items-center justify-between px-5 py-4 ${
                i < teams.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <button
                onClick={() => navigate(`/teams/${team.id}`)}
                className="flex-1 text-left group"
              >
                <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {team.name}
                </div>
                {team.description && (
                  <div className="text-sm text-gray-400 mt-0.5">{team.description}</div>
                )}
              </button>
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleDelete(team)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
