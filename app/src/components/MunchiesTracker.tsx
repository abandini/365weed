import { useState, useEffect } from 'react';

interface Munchie {
  id: string;
  category: string;
  item: string;
  emoji: string;
  timestamp: number;
}

interface MunchieCategory {
  id: string;
  label: string;
  emoji: string;
  suggestions: string[];
}

const categories: MunchieCategory[] = [
  { id: 'sweet', label: 'Sweet', emoji: '🍪', suggestions: ['Cookies', 'Ice Cream', 'Chocolate', 'Candy', 'Brownies', 'Cake'] },
  { id: 'salty', label: 'Salty', emoji: '🥨', suggestions: ['Chips', 'Pretzels', 'Popcorn', 'Crackers', 'Nuts', 'Fries'] },
  { id: 'savory', label: 'Savory', emoji: '🍕', suggestions: ['Pizza', 'Burgers', 'Tacos', 'Nachos', 'Wings', 'Sandwiches'] },
  { id: 'healthy', label: 'Healthy', emoji: '🥗', suggestions: ['Fruit', 'Veggies', 'Hummus', 'Yogurt', 'Smoothie', 'Salad'] },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️', suggestions: ['Hot Wings', 'Spicy Chips', 'Jalapeño Poppers', 'Curry', 'Hot Sauce', 'Spicy Ramen'] },
  { id: 'drinks', label: 'Drinks', emoji: '🥤', suggestions: ['Soda', 'Juice', 'Water', 'Tea', 'Coffee', 'Smoothie'] }
];

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

export default function MunchiesTracker() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customItem, setCustomItem] = useState('');
  const [todaysMunchies, setTodaysMunchies] = useState<Munchie[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({ total: 0, mostCommon: '', streak: 0 });

  useEffect(() => {
    loadTodaysMunchies();
    calculateStats();
  }, []);

  function loadTodaysMunchies() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('munchies_log');

    if (stored) {
      const allMunchies: Munchie[] = JSON.parse(stored);
      const todaysItems = allMunchies.filter(m =>
        new Date(m.timestamp).toDateString() === today
      );
      setTodaysMunchies(todaysItems);
    }
  }

  function calculateStats() {
    const stored = localStorage.getItem('munchies_log');
    if (!stored) return;

    const allMunchies: Munchie[] = JSON.parse(stored);

    // Total count
    const total = allMunchies.length;

    // Most common item
    const itemCounts: Record<string, number> = {};
    allMunchies.forEach(m => {
      itemCounts[m.item] = (itemCounts[m.item] || 0) + 1;
    });
    const mostCommon = Object.keys(itemCounts).reduce((a, b) =>
      itemCounts[a] > itemCounts[b] ? a : b, ''
    );

    // Streak (consecutive days with logs)
    const dates = [...new Set(allMunchies.map(m =>
      new Date(m.timestamp).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      if (dates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    setStats({ total, mostCommon, streak });
  }

  async function logMunchie(category: string, item: string) {
    const emoji = categories.find(c => c.id === category)?.emoji || '🍴';

    const newMunchie: Munchie = {
      id: Date.now().toString(),
      category,
      item,
      emoji,
      timestamp: Date.now()
    };

    // Save to localStorage
    const stored = localStorage.getItem('munchies_log');
    const allMunchies = stored ? JSON.parse(stored) : [];
    allMunchies.push(newMunchie);
    localStorage.setItem('munchies_log', JSON.stringify(allMunchies));

    // Update state
    setTodaysMunchies([...todaysMunchies, newMunchie]);
    setSelectedCategory(null);
    setCustomItem('');
    setShowSuccess(true);
    calculateStats();

    // Award points
    const userId = 1; // TODO: Get from auth context
    try {
      await fetch(`${API_BASE}/api/points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          points: 5,
          reason: `Logged munchie: ${item}`,
          category: 'munchies'
        })
      });

      // Check for Munchie Master achievement (20+ logs)
      if (allMunchies.length >= 20) {
        // Try to unlock achievement (assuming ID exists)
        await fetch(`${API_BASE}/api/achievements/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            achievement_id: 'munchie_master'
          })
        });
      }
    } catch (error) {
      console.error('Failed to award munchie points:', error);
    }

    setTimeout(() => setShowSuccess(false), 2000);
  }

  function handleQuickLog(category: string, item: string) {
    logMunchie(category, item);
  }

  function handleCustomLog() {
    if (!selectedCategory || !customItem.trim()) return;
    logMunchie(selectedCategory, customItem.trim());
  }

  return (
    <section className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-2xl p-6 border border-orange-500/30 shadow-lg relative overflow-hidden">
      {/* Success Animation */}
      {showSuccess && (
        <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center z-10 animate-fadeIn">
          <div className="text-center animate-bounceIn">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-lg font-bold text-white">Munchie Logged!</div>
            <div className="text-sm text-orange-200">+5 points</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="text-5xl">🍕</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-orange-300 mb-2">Munchies Tracker</h3>
          <p className="text-gray-300 text-sm">Log your snack attacks and track your cravings! 🤤</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-300">{stats.total}</div>
          <div className="text-xs text-gray-400">Total Logged</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-300">{stats.streak}</div>
          <div className="text-xs text-gray-400">Day Streak</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-sm font-bold text-orange-300 truncate">{stats.mostCommon || 'None yet'}</div>
          <div className="text-xs text-gray-400">Most Common</div>
        </div>
      </div>

      {/* Category Selection */}
      {!selectedCategory ? (
        <div>
          <p className="text-sm text-gray-400 mb-3">What kind of munchies? 🤔</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all transform hover:scale-105 border border-gray-600 hover:border-orange-500/50"
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-xs text-gray-300 font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Pick a {categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} munchie:</p>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-gray-500 hover:text-white"
            >
              ← Back
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {categories.find(c => c.id === selectedCategory)?.suggestions.map(item => (
              <button
                key={item}
                onClick={() => handleQuickLog(selectedCategory, item)}
                className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-sm transition-all border border-orange-500/30 hover:border-orange-500/50"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomLog()}
              placeholder="Or type your own..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={handleCustomLog}
              disabled={!customItem.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              Log
            </button>
          </div>
        </div>
      )}

      {/* Today's Munchies */}
      {todaysMunchies.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 mb-3">Today's Munchies ({todaysMunchies.length}):</p>
          <div className="flex flex-wrap gap-2">
            {todaysMunchies.slice().reverse().map(munchie => (
              <span
                key={munchie.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-full text-xs"
              >
                <span>{munchie.emoji}</span>
                <span className="text-gray-300">{munchie.item}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-bounceIn {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </section>
  );
}
