import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface CommunityStatsData {
  active_users: number | null;
  avg_mood_improvement: number | null;
  trending_method: string | null;
  message?: string;
}

function CommunityStats() {
  const [stats, setStats] = useState<CommunityStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/community/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (stats?.message) {
    return null; // Not enough data for privacy
  }

  return (
    <div className="bg-gradient-to-br from-purple/20 via-teal/10 to-primary/20 rounded-xl p-6 border border-purple/30">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🌍</span> Community Insights
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        {stats?.active_users && (
          <div>
            <div className="text-3xl font-bold text-primary">{stats.active_users}+</div>
            <div className="text-xs text-gray-400">Active Today</div>
          </div>
        )}
        {stats?.avg_mood_improvement && (
          <div>
            <div className="text-3xl font-bold text-gold">
              +{Math.round(stats.avg_mood_improvement)}%
            </div>
            <div className="text-xs text-gray-400">Avg Mood Lift</div>
          </div>
        )}
        {stats?.trending_method && (
          <div>
            <div className="text-3xl font-bold text-teal capitalize">{stats.trending_method}</div>
            <div className="text-xs text-gray-400">Trending Method</div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        *Anonymized data from users in your region
      </p>
    </div>
  );
}

export default CommunityStats;
