import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface KonamiModalProps {
  onClose: () => void;
  onAwardPoints: () => void;
}

export default function KonamiModal({ onClose, onAwardPoints }: KonamiModalProps) {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    // Award points when modal appears
    onAwardPoints();

    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    // Update window dimensions on resize
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose, onAwardPoints]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Rainbow Confetti */}
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={true}
        numberOfPieces={500}
        gravity={0.2}
        colors={['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']}
      />

      {/* Modal Content */}
      <div className="relative z-10 text-center animate-bounceIn">
        <div className="mb-6">
          <div className="text-9xl animate-spin-slow">🎮</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-1 rounded-2xl animate-rainbow-pulse">
          <div className="bg-gray-900 rounded-xl p-8">
            <h1 className="text-5xl font-bold mb-4 animate-rainbow-text">
              KONAMI CODE ACTIVATED!
            </h1>

            <p className="text-2xl text-gray-300 mb-6">
              You've unlocked the legendary secret! 🎉
            </p>

            <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-xl p-6 mb-6 animate-glow-pulse">
              <div className="text-6xl font-black text-white">
                +100 POINTS
              </div>
              <div className="text-lg text-white/90 mt-2">
                Achievement Unlocked: "Code Master" 👾
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              ↑ ↑ ↓ ↓ ← → ← → B A
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              CONTINUE 🚀
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6 animate-pulse">
          The 80s called... they're proud of you! 📼
        </p>
      </div>

      <style>{`
        @keyframes rainbow-pulse {
          0%, 100% {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          14% {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          28% {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          42% {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
          57% {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }
          71% {
            background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
          }
          85% {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          }
        }

        @keyframes rainbow-text {
          0% { color: #ff0000; }
          14% { color: #ff7f00; }
          28% { color: #ffff00; }
          42% { color: #00ff00; }
          57% { color: #0000ff; }
          71% { color: #4b0082; }
          85% { color: #9400d3; }
          100% { color: #ff0000; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-rainbow-pulse {
          animation: rainbow-pulse 3s ease-in-out infinite;
        }

        .animate-rainbow-text {
          animation: rainbow-text 2s linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        .animate-bounceIn {
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
