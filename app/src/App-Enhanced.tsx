import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TodayEnhanced from './routes/TodayEnhanced';
import CalendarEnhanced from './routes/CalendarEnhanced';
import Favorites from './routes/Favorites';
import Journal from './routes/Journal';
import Achievements from './routes/Achievements';
import Settings from './routes/Settings';
import Lists from './routes/Lists';
import News from './routes/News';
import InstallPrompt from './components/InstallPrompt';

function AppContent() {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Today', icon: '🏠' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/news', label: 'News', icon: '📰' },
    { path: '/favorites', label: 'Favorites', icon: '⭐' },
    { path: '/journal', label: 'Journal', icon: '📝' },
    { path: '/achievements', label: 'Achievements', icon: '🏆' },
    { path: '/lists', label: 'Lists', icon: '📋' },
  ];

  return (
    <div className="min-h-screen font-body">
      {/* Floating leaf particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-leaf-fall opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 2.5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          >
            {['🍃', '🌿', '💚'][i % 3]}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-forest-950/80 border-b border-cannabis/20
                    shadow-lifted">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="group flex items-center gap-3 hover:opacity-90 transition">
              {/* Cannabis leaf icon */}
              <div className="relative">
                <svg
                  className="w-12 h-12 text-cannabis-glow drop-shadow-glow-green
                           group-hover:scale-110 transition-transform duration-300"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C11.5 2 11 2.19 10.59 2.59C10.2 3 10 3.5 10 4V12C10 12.5 10.2 13 10.59 13.41C11 13.81 11.5 14 12 14C12.5 14 13 13.81 13.41 13.41C13.81 13 14 12.5 14 12V4C14 3.5 13.81 3 13.41 2.59C13 2.19 12.5 2 12 2M9 7C8.5 7 8 7.19 7.59 7.59C7.2 8 7 8.5 7 9V12C7 12.5 7.2 13 7.59 13.41C8 13.81 8.5 14 9 14C9.5 14 10 13.81 10.41 13.41C10.81 13 11 12.5 11 12V9C11 8.5 10.81 8 10.41 7.59C10 7.19 9.5 7 9 7M15 7C14.5 7 14 7.19 13.59 7.59C13.2 8 13 8.5 13 9V12C13 12.5 13.2 13 13.59 13.41C14 13.81 14.5 14 15 14C15.5 14 16 13.81 16.41 13.41C16.81 13 17 12.5 17 12V9C17 8.5 16.81 8 16.41 7.59C16 7.19 15.5 7 15 7M12 15C11.39 15 10.83 15.32 10.41 15.73L8.5 17.64C7.67 18.47 7 19.72 7 21V22H17V21C17 19.72 16.33 18.47 15.5 17.64L13.59 15.73C13.17 15.32 12.61 15 12 15Z"/>
                </svg>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cannabis rounded-full
                             animate-glow-pulse"></div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-display bg-gradient-to-r from-cannabis
                             via-cannabis-glow to-cannabis-light bg-clip-text text-transparent
                             leading-tight">
                  365 Days of Weed
                </h1>
                <p className="text-sm text-gray-500 font-handwritten">
                  Daily Cannabis Education
                </p>
              </div>
            </Link>

            {/* Settings Icon */}
            <Link
              to="/settings"
              className="p-3 hover:bg-cannabis/10 rounded-xl transition-all duration-300
                       hover:scale-110 group"
            >
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-cannabis-glow transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    relative px-4 py-2 rounded-xl font-display text-sm md:text-base
                    transition-all duration-300 hover:scale-105 active:scale-95
                    flex items-center gap-2
                    ${isActive
                      ? 'bg-cannabis text-forest-950 shadow-glow-green font-bold'
                      : 'bg-forest-800/50 text-gray-300 hover:bg-cannabis/20 hover:text-cannabis-glow border border-cannabis/10'
                    }
                  `}
                >
                  <span>{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5
                                  bg-cannabis-glow animate-glow-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<TodayEnhanced />} />
          <Route path="/calendar" element={<CalendarEnhanced />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<News />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/:slug" element={<Lists />} />
        </Routes>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Footer */}
      <footer className="relative z-10 mt-20 py-8 border-t border-cannabis/10 bg-forest-950/50
                       backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500 font-body text-sm mb-2">
            For adults 21+ in legal jurisdictions.
          </p>
          <p className="text-gray-600 font-body text-xs">
            Educational content only; not medical advice.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
            <span>Made with</span>
            <span className="text-cannabis animate-glow-pulse">💚</span>
            <span>for the cannabis community</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
