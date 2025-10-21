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
  const [viewMode, setViewMode] = useState<'overview' | 'entries'>('overview');

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

  // Calculate mood improvement percentage
  const moodImprovement = stats?.avg_mood_before && stats?.avg_mood_after
    ? ((stats.avg_mood_after - stats.avg_mood_before) / stats.avg_mood_before) * 100
    : 0;

  // Group entries by method
  const methodCounts = entries.reduce((acc, entry) => {
    if (entry.method) {
      acc[entry.method] = (acc[entry.method] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const maxMethodCount = Math.max(...Object.values(methodCounts), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading journal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gold/20 to-purple/10 rounded-2xl p-6 border border-gold/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gold to-purple bg-clip-text text-transparent">
              My Wellness Journal
            </h2>
            <p className="text-gray-400 mt-1">Track your cannabis wellness journey</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-glow transform hover:-translate-y-0.5"
          >
            {showForm ? '✕ Cancel' : '+ New Entry'}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              viewMode === 'overview'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setViewMode('entries')}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              viewMode === 'entries'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📝 Entries ({entries.length})
          </button>
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl space-y-4"
        >
          <h3 className="text-xl font-bold mb-4">New Journal Entry</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Method</label>
              <select
                name="method"
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
              >
                <option value="">Select...</option>
                <option value="vape">🌫️ Vape</option>
                <option value="edible">🍪 Edible</option>
                <option value="joint">🚬 Joint</option>
                <option value="topical">🧴 Topical</option>
                <option value="tincture">💧 Tincture</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Amount</label>
              <input
                type="number"
                step="0.1"
                name="amount"
                placeholder="e.g., 10"
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Units</label>
              <select
                name="units"
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
              >
                <option value="mg">mg (milligrams)</option>
                <option value="g">g (grams)</option>
                <option value="puffs">puffs</option>
                <option value="drops">drops</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                Mood Before (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                name="mood_before"
                placeholder="1-10"
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                Mood After (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                name="mood_after"
                placeholder="1-10"
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                Sleep (hours)
              </label>
              <input
                type="number"
                step="0.5"
                name="sleep_hours"
                placeholder="e.g., 7.5"
                className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2 font-medium">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="How did you feel? Any observations?"
              className="w-full bg-gray-900 border border-gray-700 hover:border-primary/50 focus:border-primary rounded-lg px-4 py-3 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl py-3 transition-all shadow-lg hover:shadow-glow"
          >
            💾 Save Entry
          </button>
        </form>
      )}

      {/* Overview View */}
      {viewMode === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-5 border border-primary/30 hover:border-primary/50 transition">
              <div className="text-sm text-gray-400 font-medium mb-1">Total Entries</div>
              <div className="text-3xl font-bold text-primary">{stats.entry_count || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </div>

            <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl p-5 border border-gold/30 hover:border-gold/50 transition">
              <div className="text-sm text-gray-400 font-medium mb-1">Mood Improvement</div>
              <div className="text-3xl font-bold text-gold">
                {moodImprovement > 0 ? '+' : ''}{moodImprovement.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Average change</div>
            </div>

            <div className="bg-gradient-to-br from-purple/20 to-purple/5 rounded-xl p-5 border border-purple/30 hover:border-purple/50 transition">
              <div className="text-sm text-gray-400 font-medium mb-1">Avg Sleep</div>
              <div className="text-3xl font-bold text-purple">
                {stats.avg_sleep_hours?.toFixed(1) || '-'}h
              </div>
              <div className="text-xs text-gray-500 mt-1">Per night</div>
            </div>

            <div className="bg-gradient-to-br from-teal/20 to-teal/5 rounded-xl p-5 border border-teal/30 hover:border-teal/50 transition">
              <div className="text-sm text-gray-400 font-medium mb-1">Consistency</div>
              <div className="text-3xl font-bold text-teal">
                {stats.entry_count >= 20 ? '🔥' : '⭐'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.entry_count >= 20 ? 'On fire!' : 'Keep going'}
              </div>
            </div>
          </div>

          {/* Mood Trend Chart */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>😊</span>
              Mood Tracking
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-3 font-medium">Before Session</div>
                <div className="relative h-40 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="h-full flex items-end">
                    <div
                      className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all"
                      style={{ height: `${((stats.avg_mood_before || 0) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className="absolute top-2 right-2 text-2xl font-bold text-orange-400">
                    {stats.avg_mood_before?.toFixed(1) || '-'}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-3 font-medium">After Session</div>
                <div className="relative h-40 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="h-full flex items-end">
                    <div
                      className="flex-1 bg-gradient-to-t from-primary to-primary-light rounded-t transition-all"
                      style={{ height: `${((stats.avg_mood_after || 0) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className="absolute top-2 right-2 text-2xl font-bold text-primary">
                    {stats.avg_mood_after?.toFixed(1) || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Method Distribution Chart */}
          {Object.keys(methodCounts).length > 0 && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span>
                Consumption Methods
              </h3>
              <div className="space-y-3">
                {Object.entries(methodCounts).map(([method, count]) => {
                  const percentage = (count / entries.length) * 100;
                  const barWidth = (count / maxMethodCount) * 100;

                  const methodColors: Record<string, string> = {
                    vape: 'bg-gradient-to-r from-blue-500 to-blue-400',
                    edible: 'bg-gradient-to-r from-orange-500 to-orange-400',
                    joint: 'bg-gradient-to-r from-green-500 to-green-400',
                    topical: 'bg-gradient-to-r from-pink-500 to-pink-400',
                    tincture: 'bg-gradient-to-r from-purple-500 to-purple-400',
                  };

                  const methodIcons: Record<string, string> = {
                    vape: '🌫️',
                    edible: '🍪',
                    joint: '🚬',
                    topical: '🧴',
                    tincture: '💧',
                  };

                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {methodIcons[method] || '📦'} {method}
                        </span>
                        <span className="text-sm text-gray-400">
                          {count} times ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-8 bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/50">
                        <div
                          className={`h-full ${methodColors[method] || 'bg-primary'} transition-all duration-500 flex items-center justify-end px-3`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-xs font-bold text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Entries Preview */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>📝</span>
                Recent Entries
              </h3>
              <button
                onClick={() => setViewMode('entries')}
                className="text-sm text-primary hover:text-primary-light transition"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {entries.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-primary/30 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{entry.date}</div>
                    {entry.method && (
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                        {entry.method}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {entry.mood_before !== undefined && (
                      <div className="text-gray-400">
                        Mood: <span className="text-white">{entry.mood_before} → {entry.mood_after}</span>
                      </div>
                    )}
                    {entry.amount && (
                      <div className="text-gray-400">
                        Dose: <span className="text-white">{entry.amount}{entry.units}</span>
                      </div>
                    )}
                    {entry.sleep_hours !== undefined && (
                      <div className="text-gray-400">
                        Sleep: <span className="text-white">{entry.sleep_hours}h</span>
                      </div>
                    )}
                  </div>
                  {entry.notes && (
                    <div className="mt-2 text-sm text-gray-400 italic">"{entry.notes}"</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entries List View */}
      {viewMode === 'entries' && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-lg">{entry.date}</div>
                {entry.method && (
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                    {entry.method}
                  </span>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                {entry.mood_before !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Mood:</span>
                    <span className="font-semibold">{entry.mood_before} → {entry.mood_after}</span>
                    {entry.mood_after && entry.mood_before && entry.mood_after > entry.mood_before && (
                      <span className="text-green-400">↑</span>
                    )}
                  </div>
                )}
                {entry.amount && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Amount:</span>
                    <span className="font-semibold">{entry.amount}{entry.units}</span>
                  </div>
                )}
                {entry.sleep_hours !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Sleep:</span>
                    <span className="font-semibold">{entry.sleep_hours}h</span>
                  </div>
                )}
              </div>
              {entry.notes && (
                <div className="mt-3 p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300 border border-gray-700/50">
                  {entry.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <div className="text-6xl mb-4">📔</div>
          <h3 className="text-xl font-bold mb-2">Start Your Wellness Journey</h3>
          <p className="text-gray-400 mb-6">
            No entries yet. Begin tracking your cannabis wellness by clicking "+ New Entry"
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-3 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-glow"
          >
            Create First Entry
          </button>
        </div>
      )}
    </div>
  );
}
