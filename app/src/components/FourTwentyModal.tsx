import { useEffect, useState } from 'react';

interface FourTwentyModalProps {
  onClose: () => void;
  onAwardPoints: () => void;
}

export default function FourTwentyModal({ onClose, onAwardPoints }: FourTwentyModalProps) {
  const [animateJoint, setAnimateJoint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger animations
    setTimeout(() => setAnimateJoint(true), 100);
    setTimeout(() => setShowConfetti(true), 300);

    // Award the points
    onAwardPoints();

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose, onAwardPoints]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['🌿', '💚', '✨', '🔥', '💨'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-md w-full bg-gradient-to-br from-primary via-teal to-gold p-8 rounded-3xl shadow-2xl transform animate-bounceIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          {/* Animated Joint Icon */}
          <div className="mb-6">
            <div
              className={`text-8xl inline-block transition-all duration-1000 ${
                animateJoint ? 'rotate-360 scale-110' : 'scale-100'
              }`}
            >
              🚬
            </div>
          </div>

          {/* Main Message */}
          <h2 className="text-4xl font-bold text-white mb-2 animate-pulse">
            It's 4:20!
          </h2>
          <p className="text-xl text-white/90 mb-6">
            Perfect timing, friend! 😎
          </p>

          {/* Points Award */}
          <div className="bg-white/20 backdrop-blur rounded-2xl p-6 mb-6">
            <div className="text-6xl font-black text-white mb-2 animate-bounce">
              +42
            </div>
            <div className="text-lg text-white/90 font-medium">
              Bonus Points! 🎉
            </div>
          </div>

          {/* Fun Message */}
          <p className="text-sm text-white/80 italic">
            "It's 4:20 somewhere... and that somewhere is RIGHT NOW!"
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-6 px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full transition-all transform hover:scale-105"
          >
            Hell Yeah! 🚀
          </button>
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

        @keyframes confetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes rotate-360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
          }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-bounceIn {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }

        .rotate-360 {
          animation: rotate-360 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}
