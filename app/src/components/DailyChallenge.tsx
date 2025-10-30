import { useState, useEffect } from 'react';

interface Challenge {
  id: string;
  text: string;
  points: number;
  icon: string;
}

const dailyChallenges: Challenge[] = [
  { id: 'new-method', text: 'Try a new consumption method today', points: 25, icon: '🌫️' },
  { id: 'share', text: 'Share this app with a friend', points: 50, icon: '🤝' },
  { id: 'journal', text: 'Log your session in the journal', points: 20, icon: '📝' },
  { id: 'read', text: "Read today's educational content", points: 15, icon: '📚' },
  { id: 'hydrate', text: 'Drink a full glass of water (seriously, hydrate!)', points: 10, icon: '💧' },
  { id: 'meditate', text: 'Try meditating for 5 minutes', points: 30, icon: '🧘' },
  { id: 'organize', text: 'Organize your stash', points: 25, icon: '🗂️' },
  { id: 'music', text: 'Listen to a full album', points: 20, icon: '🎵' },
];

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [status, setStatus] = useState<'pending' | 'accepted' | 'completed'>('pending');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadTodaysChallenge();
  }, []);

  function loadTodaysChallenge() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('daily_challenge');

    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        // Same day, restore state
        setChallenge(data.challenge);
        setStatus(data.status);
        return;
      }
    }

    // New day, generate new challenge
    const dayIndex = new Date().getDate();
    const todaysChallenge = dailyChallenges[dayIndex % dailyChallenges.length];

    setChallenge(todaysChallenge);
    setStatus('pending');

    localStorage.setItem('daily_challenge', JSON.stringify({
      date: today,
      challenge: todaysChallenge,
      status: 'pending'
    }));
  }

  async function acceptChallenge() {
    setStatus('accepted');
    updateStorage('accepted');
  }

  async function completeChallenge() {
    if (!challenge) return;

    // Award points via API
    const userId = 1; // TODO: Get from auth context
    const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

    try {
      await fetch(`${API_BASE}/api/points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          points: challenge.points,
          reason: `Daily Challenge: ${challenge.text}`,
          category: 'challenge'
        })
      });

      setStatus('completed');
      setShowSuccess(true);
      updateStorage('completed');

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to complete challenge:', error);
    }
  }

  function updateStorage(newStatus: 'pending' | 'accepted' | 'completed') {
    const today = new Date().toDateString();
    localStorage.setItem('daily_challenge', JSON.stringify({
      date: today,
      challenge,
      status: newStatus
    }));
  }

  if (!challenge) return null;

  return (
    <section className="bg-gradient-to-br from-teal/20 to-primary/20 rounded-2xl p-6 border border-teal/30 shadow-lg relative overflow-hidden">
      {/* Success Animation */}
      {showSuccess && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10 animate-fadeIn">
          <div className="text-center animate-bounceIn">
            <div className="text-6xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-white">Challenge Complete!</div>
            <div className="text-lg text-teal-light">+{challenge.points} points!</div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="text-5xl">{challenge.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-teal-light">Daily Challenge 🎯</h3>
            {status === 'completed' && (
              <span className="px-2 py-1 bg-primary/30 text-primary-light text-xs font-bold rounded-full">
                ✅ DONE
              </span>
            )}
            {status === 'accepted' && (
              <span className="px-2 py-1 bg-teal/30 text-teal-light text-xs font-bold rounded-full">
                IN PROGRESS
              </span>
            )}
          </div>

          <p className="text-gray-300 leading-relaxed mb-3">{challenge.text}</p>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              Reward: <span className="text-gold font-bold">+{challenge.points} points</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            {status === 'pending' && (
              <button
                onClick={acceptChallenge}
                className="px-6 py-2 bg-gradient-to-r from-teal to-primary hover:from-teal-light hover:to-primary-light text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Accept Challenge 💪
              </button>
            )}

            {status === 'accepted' && (
              <button
                onClick={completeChallenge}
                className="px-6 py-2 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Mark as Complete ✅
              </button>
            )}

            {status === 'completed' && (
              <div className="flex items-center gap-2 text-primary-light">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">Crushed it! Come back tomorrow for a new challenge.</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
