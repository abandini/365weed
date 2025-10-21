import { useEffect, useState } from 'react';

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon_emoji: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: number;
  unlocked_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = 1; // TODO: Get from auth context

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/achievements`).then(r => r.json()),
      fetch(`${API_BASE}/api/achievements/${userId}`).then(r => r.json())
    ]).then(([allData, userData]) => {
      setAchievements(allData.achievements || []);
      setUserAchievements(userData.achievements || []);
      setLoading(false);
    });
  }, [userId]);

  const isUnlocked = (achievementId: number) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'from-yellow-700 to-yellow-900',
      silver: 'from-gray-300 to-gray-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getTierBorder = (tier: string) => {
    const borders = {
      bronze: 'border-yellow-700',
      silver: 'border-gray-400',
      gold: 'border-yellow-500',
      platinum: 'border-purple-500'
    };
    return borders[tier as keyof typeof borders] || borders.bronze;
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const totalPoints = userAchievements.reduce((sum, ua) => {
    const achievement = achievements.find(a => a.id === ua.achievement_id);
    return sum + (achievement?.points || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gold via-purple to-gold bg-clip-text text-transparent mb-2">
          Achievements
        </h1>
        <p className="text-gray-400 mb-4">
          Unlock achievements by journaling, maintaining streaks, and exploring cannabis knowledge
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-gray-400">Unlocked:</span>{' '}
            <span className="text-primary font-bold">{userAchievements.length}/{achievements.length}</span>
          </div>
          <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-gray-400">Total Points:</span>{' '}
            <span className="text-gold font-bold">{totalPoints}</span>
          </div>
        </div>
      </div>

      {/* Achievement Categories */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-bold capitalize mb-4 text-teal">
            {category} Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAchievements.map((achievement) => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`
                    relative p-6 rounded-lg border-2 transition-all duration-300
                    ${unlocked
                      ? `bg-gradient-to-br ${getTierColor(achievement.tier)} ${getTierBorder(achievement.tier)} shadow-lg hover:scale-105`
                      : 'bg-gray-800/30 border-gray-700 opacity-50 hover:opacity-70'
                    }
                  `}
                >
                  {/* Tier Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`
                      text-xs font-bold px-2 py-1 rounded uppercase
                      ${unlocked ? 'bg-black/30 text-white' : 'bg-gray-700 text-gray-400'}
                    `}>
                      {achievement.tier}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-3 text-center">
                    {unlocked ? achievement.icon_emoji : '🔒'}
                  </div>

                  {/* Name */}
                  <h3 className={`
                    text-lg font-bold mb-2 text-center
                    ${unlocked ? 'text-white' : 'text-gray-500'}
                  `}>
                    {achievement.name}
                  </h3>

                  {/* Description */}
                  <p className={`
                    text-sm text-center mb-3
                    ${unlocked ? 'text-gray-200' : 'text-gray-600'}
                  `}>
                    {achievement.description}
                  </p>

                  {/* Points */}
                  <div className="text-center">
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-bold
                      ${unlocked
                        ? 'bg-black/40 text-yellow-300'
                        : 'bg-gray-700/50 text-gray-500'
                      }
                    `}>
                      {achievement.points} points
                    </span>
                  </div>

                  {/* Unlocked Date */}
                  {unlocked && (
                    <div className="mt-3 text-center text-xs text-gray-300">
                      Unlocked: {new Date(
                        userAchievements.find(ua => ua.achievement_id === achievement.id)?.unlocked_at || ''
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-400 text-lg">No achievements yet. Start journaling to unlock them!</p>
        </div>
      )}
    </div>
  );
}

export default Achievements;
