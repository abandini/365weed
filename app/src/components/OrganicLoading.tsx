export default function OrganicLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
      {/* Animated leaf cluster */}
      <div className="relative w-32 h-32">
        {/* Center leaf */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-7xl animate-float-medium">
            🌿
          </div>
        </div>

        {/* Orbiting leaves */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-4xl opacity-50">
            🍃
          </div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl opacity-50">
            💚
          </div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s' }}>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl opacity-50">
            ✨
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-display text-cannabis-glow animate-glow-pulse">
          Rolling one up...
        </h3>
        <p className="text-gray-400 font-body text-sm">
          Preparing your daily dose of knowledge
        </p>
      </div>

      {/* Loading bar */}
      <div className="w-64 h-1.5 bg-forest-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cannabis via-cannabis-glow to-cannabis
                      animate-pulse"
             style={{ width: '70%' }}>
        </div>
      </div>
    </div>
  );
}
