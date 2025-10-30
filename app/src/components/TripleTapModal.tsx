import { useEffect } from 'react';

interface TripleTapModalProps {
  onClose: () => void;
  onAwardPoints: () => void;
}

export default function TripleTapModal({ onClose, onAwardPoints }: TripleTapModalProps) {
  useEffect(() => {
    // Award points when modal appears
    onAwardPoints();

    // Auto-close after 6 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onClose, onAwardPoints]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Content */}
      <div className="relative z-10 text-center animate-tapIn">
        <div className="mb-6">
          <div className="text-9xl animate-bounce-slow">🌿</div>
        </div>

        <div className="bg-gradient-to-br from-primary via-teal to-primary-light p-1 rounded-2xl">
          <div className="bg-gray-900 rounded-xl p-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-light via-teal-light to-primary bg-clip-text text-transparent">
              TAP TAP BOOM!
            </h1>

            <p className="text-2xl text-gray-300 mb-6">
              You discovered the triple-tap secret! 🎯
            </p>

            <div className="bg-gradient-to-r from-primary to-teal rounded-xl p-6 mb-6 animate-glow-pulse">
              <div className="text-6xl font-black text-white">
                +50 POINTS
              </div>
              <div className="text-lg text-white/90 mt-2">
                Achievement Unlocked: "Tap Master" 👆
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 italic">
                "Sometimes the best things are hidden in plain sight..." 👁️
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              KEEP EXPLORING 🚀
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6 animate-pulse">
          There are more secrets waiting to be found... 🔍
        </p>
      </div>

      <style>{`
        @keyframes tapIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-tapIn {
          animation: tapIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
