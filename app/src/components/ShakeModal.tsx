import { useEffect } from 'react';

interface ShakeModalProps {
  onClose: () => void;
  onAwardPoints: () => void;
}

export default function ShakeModal({ onClose, onAwardPoints }: ShakeModalProps) {
  useEffect(() => {
    // Award points when modal appears
    onAwardPoints();

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose, onAwardPoints]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Content */}
      <div className="relative z-10 text-center animate-shakeIn">
        <div className="mb-6">
          <div className="text-9xl animate-shake">📱</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 p-1 rounded-2xl animate-pulse">
          <div className="bg-gray-900 rounded-xl p-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              SHAKE IT OFF!
            </h1>

            <p className="text-2xl text-gray-300 mb-6">
              You found the shake secret! 🎉
            </p>

            <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-xl p-6 mb-6">
              <div className="text-6xl font-black text-white">
                +25 POINTS
              </div>
              <div className="text-lg text-white/90 mt-2">
                Achievement Unlocked: "Shake Master" 📱
              </div>
            </div>

            <p className="text-sm text-gray-400">
              Keep exploring for more secrets! 👀
            </p>

            <button
              onClick={onClose}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              NICE! 🚀
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Shake responsibly! 😄
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: translateX(10px) rotate(5deg); }
        }

        @keyframes shakeIn {
          0% {
            transform: scale(0.5) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .animate-shake {
          animation: shake 1s ease-in-out infinite;
        }

        .animate-shakeIn {
          animation: shakeIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
