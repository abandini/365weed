import { useEffect, useState } from 'react';
import {
  createJournalEntry,
  getJournalEntries,
  getJournalStats,
  JournalEntry,
} from '../lib/api';

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Mock user ID - in production, get from auth
  const userId = 1;

  useEffect(() => {
    loadJournal();
  }, []);

  async function loadJournal() {
    try {
      setLoading(true);
      const [entriesResult, statsResult] = await Promise.all([
        getJournalEntries(userId),
        getJournalStats(userId, 30),
      ]);
      setEntries(entriesResult.entries);
      setStats(statsResult.stats);
    } catch (err) {
      console.error('Failed to load journal:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const entry: JournalEntry = {
      user_id: userId,
      date: formData.get('date') as string,
      method: formData.get('method') as string,
      amount: parseFloat(formData.get('amount') as string) || undefined,
      units: formData.get('units') as string,
      mood_before: parseInt(formData.get('mood_before') as string) || undefined,
      mood_after: parseInt(formData.get('mood_after') as string) || undefined,
      sleep_hours: parseFloat(formData.get('sleep_hours') as string) || undefined,
      notes: formData.get('notes') as string,
    };

    try {
      await createJournalEntry(entry);
      setShowForm(false);
      loadJournal(); // Reload
      e.currentTarget.reset();
    } catch (err) {
      console.error('Failed to create entry:', err);
      alert('Failed to save entry');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Journal</h2>
          <p className="text-gray-400">Track your cannabis wellness journey</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Entries (30d)</div>
            <div className="text-2xl font-bold">{stats.entry_count || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Avg Mood Before</div>
            <div className="text-2xl font-bold">
              {stats.avg_mood_before?.toFixed(1) || '-'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Avg Mood After</div>
            <div className="text-2xl font-bold">
              {stats.avg_mood_after?.toFixed(1) || '-'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Avg Sleep</div>
            <div className="text-2xl font-bold">
              {stats.avg_sleep_hours?.toFixed(1) || '-'}h
            </div>
          </div>
        </div>
      )}

      {/* Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-lg p-6 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Method</label>
              <select
                name="method"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              >
                <option value="">Select...</option>
                <option value="vape">Vape</option>
                <option value="edible">Edible</option>
                <option value="joint">Joint</option>
                <option value="topical">Topical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                step="0.1"
                name="amount"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Units</label>
              <select
                name="units"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              >
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="puffs">puffs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Mood Before (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                name="mood_before"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Mood After (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                name="mood_after"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Sleep (hours)
              </label>
              <input
                type="number"
                step="0.5"
                name="sleep_hours"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 rounded-lg py-2 transition"
          >
            Save Entry
          </button>
        </form>
      )}

      {/* Entry List */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{entry.date}</div>
              {entry.method && (
                <span className="px-2 py-1 bg-primary/20 rounded text-xs">
                  {entry.method}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm text-gray-400">
              {entry.mood_before && (
                <div>Mood: {entry.mood_before} → {entry.mood_after}</div>
              )}
              {entry.amount && (
                <div>Amount: {entry.amount}{entry.units}</div>
              )}
              {entry.sleep_hours && (
                <div>Sleep: {entry.sleep_hours}h</div>
              )}
            </div>
            {entry.notes && (
              <div className="mt-2 text-sm text-gray-300">{entry.notes}</div>
            )}
          </div>
        ))}
      </div>

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          No entries yet. Start your journal by clicking "+ New Entry"
        </div>
      )}
    </div>
  );
}
