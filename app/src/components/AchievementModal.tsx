import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon_emoji: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: string;
}

interface AchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  const [visible, setVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      setShowConfetti(true);

      // Stop confetti after 5 seconds
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      // Auto-close after 8 seconds
      const closeTimer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [achievement]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  if (!achievement) return null;

  const getUnlockMessage = () => {
    const messages = [
      "BRUH! You just unlocked",
      "No way! You're a",
      "Hell yeah! You got",
      "You absolute legend!",
      "Holy shit, you did it!",
      "Crushing it! You unlocked"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'from-amber-600 to-amber-800';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'shadow-amber-500/50';
      case 'silver':
        return 'shadow-gray-500/50';
      case 'gold':
        return 'shadow-yellow-500/50';
      case 'platinum':
        return 'shadow-purple-500/50';
      default:
        return 'shadow-gray-500/50';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          colors={['#17a34a', '#14b8a6', '#f59e0b', '#a855f7', '#22c55e', '#fbbf24']}
        />
      )}

      <div
        className={`achievement-modal transform transition-all duration-500 ${
          visible ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`max-w-md w-full mx-4 rounded-2xl bg-gradient-to-br ${getTierColor(
            achievement.tier
          )} p-8 text-white shadow-2xl ${getTierGlow(achievement.tier)} animate-pulse`}
        >
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="confetti"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="text-6xl mb-4 animate-bounce">{achievement.icon_emoji}</div>

            <div className="mb-2 text-lg font-bold tracking-wide opacity-90">
              {getUnlockMessage()}
            </div>

            <h2 className="text-3xl font-bold mb-2">{achievement.name}!</h2>

            <p className="text-white/90 mb-4">{achievement.description}</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold">+{achievement.points} Points</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/20 text-sm uppercase">
                {achievement.tier}
              </div>
            </div>

            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-105 backdrop-blur-sm font-bold"
            >
              Hell Yeah! 🎉
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti::before,
        .confetti::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: white;
          animation: confetti-fall 3s ease-in-out infinite;
        }

        .confetti::before {
          left: 20%;
          animation-delay: 0s;
        }

        .confetti::after {
          left: 80%;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}

export default AchievementModal;
