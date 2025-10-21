import { useState, useEffect } from 'react';

interface StreakData {
  user_id: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_check_in: string | null;
  status: 'active' | 'checked_in_today' | 'broken' | 'saved';
}

interface StreakBadgeProps {
  userId: number;
  onClick?: () => void;
}

export function StreakBadge({ userId, onClick }: StreakBadgeProps) {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, [userId]);

  const fetchStreak = async () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';
    try {
      const response = await fetch(`${API_BASE}/api/streaks/${userId}`);
      const data = await response.json();
      setStreak(data.streak);
    } catch (error) {
      console.error('Failed to fetch streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !streak) {
    return (
      <div className="streak-badge loading">
        <span className="streak-icon">🔥</span>
        <span className="streak-count">-</span>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (streak.status) {
      case 'checked_in_today':
        return 'text-green-500';
      case 'saved':
        return 'text-yellow-500';
      case 'broken':
        return 'text-red-500';
      default:
        return 'text-orange-500';
    }
  };

  const getStatusText = () => {
    switch (streak.status) {
      case 'checked_in_today':
        return 'Checked in today!';
      case 'saved':
        return 'Streak saved!';
      case 'broken':
        return 'Streak broken';
      default:
        return `${streak.current_streak} day streak`;
    }
  };

  return (
    <div
      className={`streak-badge cursor-pointer transition-all hover:scale-110 ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      title={getStatusText()}
    >
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
        <span className="text-xl animate-pulse">🔥</span>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium opacity-90">Streak</span>
          <span className={`text-lg font-bold ${getStatusColor()}`}>
            {streak.current_streak}
          </span>
        </div>
        <div className="flex flex-col items-start ml-2 border-l border-white/30 pl-2">
          <span className="text-xs opacity-75">Points</span>
          <span className="text-sm font-semibold">{streak.total_points}</span>
        </div>
      </div>
    </div>
  );
}

export default StreakBadge;
