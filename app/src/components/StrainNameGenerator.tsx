import { useState } from 'react';

interface StrainNameGeneratorProps {
  onClose: () => void;
}

const adjectives = [
  'Purple', 'Green', 'Golden', 'Crystal', 'Frosty', 'Mystic', 'Cosmic',
  'Electric', 'Diamond', 'Platinum', 'Velvet', 'Thunder', 'Zen', 'Lunar',
  'Solar', 'Arctic', 'Tropical', 'Ancient', 'Wild', 'Sacred', 'Nebula',
  'Quantum', 'Galactic', 'Stellar', 'Chakra', 'Blissful', 'Supreme'
];

const nouns = [
  'Kush', 'Dream', 'Haze', 'Diesel', 'Cookies', 'Widow', 'Jack',
  'Cheese', 'Berry', 'Glue', 'Breath', 'Fire', 'Thunder', 'Paradise',
  'Skunk', 'Wreck', 'Punch', 'Express', 'Magic', 'Spirit', 'Dragon',
  'Phoenix', 'Buddha', 'Sherbet', 'Cake', 'Pie', 'Runtz'
];

const suffixes = [
  'OG', 'Supreme', 'Express', 'Special', 'Reserve', 'Ultra', 'XL',
  'Deluxe', '420', 'Fusion', 'Edition', 'Prime', 'Max', 'Pro',
  '#1', 'Classic', 'Original', 'Legacy', 'Elite', 'Royal'
];

function generateStrainName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const useSuffix = Math.random() > 0.5;

  if (useSuffix) {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${adjective} ${noun} ${suffix}`;
  }

  return `${adjective} ${noun}`;
}

export default function StrainNameGenerator({ onClose }: StrainNameGeneratorProps) {
  const [currentStrain, setCurrentStrain] = useState(generateStrainName());
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = () => {
    setIsGenerating(true);

    // Fun animation: generate multiple times quickly
    let count = 0;
    const interval = setInterval(() => {
      setCurrentStrain(generateStrainName());
      count++;

      if (count >= 10) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 100);
  };

  const shareStrain = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Strain Name',
        text: `Check out my strain: ${currentStrain}! 🌿`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${currentStrain} 🌿`);
      alert('Strain name copied to clipboard! 📋');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-8 max-w-lg w-full border border-purple/30 shadow-2xl relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float">🎲</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple via-gold to-teal bg-clip-text text-transparent mb-2">
            Strain Name Generator
          </h2>
          <p className="text-gray-400 text-sm">
            Your cosmic strain of the day awaits...
          </p>
        </div>

        {/* Generated Strain Name */}
        <div className="bg-gradient-to-br from-purple/20 to-teal/20 rounded-xl p-6 mb-6 border border-purple/30 min-h-[120px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🌿</div>
            <p className={`text-3xl font-bold bg-gradient-to-r from-gold via-purple to-teal bg-clip-text text-transparent ${isGenerating ? 'animate-glow-pulse' : ''}`}>
              {currentStrain}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generate}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple to-teal hover:from-purple-light hover:to-teal-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {isGenerating ? '🎲 Rolling...' : '🎲 Generate New'}
          </button>

          <button
            onClick={shareStrain}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            📤 Share
          </button>
        </div>

        {/* Fun fact */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 italic">
            Pro tip: Screenshot and share your strain name on social media! 📸
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
