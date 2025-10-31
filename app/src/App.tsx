import { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Today from './routes/Today';
import Calendar from './routes/Calendar';
import Journal from './routes/Journal';
import PartnerDashboard from './routes/PartnerDashboard';
import Achievements from './routes/Achievements';
import Settings from './routes/Settings';
import Referrals from './routes/Referrals';
import Upgrade from './routes/Upgrade';
import Onboarding from './routes/Onboarding';
import Lists from './routes/Lists';
import StreakBadge from './components/StreakBadge';
import ThemeToggle from './components/ThemeToggle';
import FloatingParticles from './components/FloatingParticles';
import KonamiModal from './components/KonamiModal';
import ShakeModal from './components/ShakeModal';
import TripleTapModal from './components/TripleTapModal';
import { useKonamiCode } from './hooks/useKonamiCode';
import { useShakeGesture } from './hooks/useShakeGesture';
import { useTripleTap } from './hooks/useTripleTap';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

function App() {
  const [showKonamiModal, setShowKonamiModal] = useState(false);
  const [showShakeModal, setShowShakeModal] = useState(false);
  const [showTripleTapModal, setShowTripleTapModal] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  // Konami Code Easter Egg
  useKonamiCode(() => {
    // Only show once per day
    const lastShown = localStorage.getItem('last_konami_shown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      setShowKonamiModal(true);
      localStorage.setItem('last_konami_shown', today);
    }
  });

  // Shake Gesture Easter Egg
  useShakeGesture(() => {
    // Only show once per day
    const lastShown = localStorage.getItem('last_shake_shown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      setShowShakeModal(true);
      localStorage.setItem('last_shake_shown', today);
    }
  });

  // Triple-Tap Easter Egg
  useTripleTap(() => {
    // Only show once per day
    const lastShown = localStorage.getItem('last_tripletap_shown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      setShowTripleTapModal(true);
      localStorage.setItem('last_tripletap_shown', today);
    }
  }, logoRef);

  async function awardKonamiPoints() {
    const userId = 1; // TODO: Get from auth context

    try {
      await fetch(`${API_BASE}/api/points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          points: 100,
          reason: 'Konami Code Activated! 🎮',
          category: 'easter_egg'
        })
      });

      // Try to unlock the achievement
      await fetch(`${API_BASE}/api/achievements/1/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
    } catch (error) {
      console.error('Failed to award Konami points:', error);
    }
  }

  async function awardShakePoints() {
    const userId = 1; // TODO: Get from auth context

    try {
      await fetch(`${API_BASE}/api/points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          points: 25,
          reason: 'Shake Gesture Activated! 📱',
          category: 'easter_egg'
        })
      });
    } catch (error) {
      console.error('Failed to award shake points:', error);
    }
  }

  async function awardTripleTapPoints() {
    const userId = 1; // TODO: Get from auth context

    try {
      await fetch(`${API_BASE}/api/points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          points: 50,
          reason: 'Triple-Tap Secret Discovered! 👆',
          category: 'easter_egg'
        })
      });
    } catch (error) {
      console.error('Failed to award triple-tap points:', error);
    }
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white bg-cannabis-pattern">
        {/* Floating background particles */}
        <FloatingParticles />
        <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="group flex items-center gap-2 hover:opacity-80 transition">
                <div ref={logoRef} className="cursor-pointer">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C11.5 2 11 2.19 10.59 2.59C10.2 3 10 3.5 10 4V12C10 12.5 10.2 13 10.59 13.41C11 13.81 11.5 14 12 14C12.5 14 13 13.81 13.41 13.41C13.81 13 14 12.5 14 12V4C14 3.5 13.81 3 13.41 2.59C13 2.19 12.5 2 12 2M9 7C8.5 7 8 7.19 7.59 7.59C7.2 8 7 8.5 7 9V12C7 12.5 7.2 13 7.59 13.41C8 13.81 8.5 14 9 14C9.5 14 10 13.81 10.41 13.41C10.81 13 11 12.5 11 12V9C11 8.5 10.81 8 10.41 7.59C10 7.19 9.5 7 9 7M15 7C14.5 7 14 7.19 13.59 7.59C13.2 8 13 8.5 13 9V12C13 12.5 13.2 13 13.59 13.41C14 13.81 14.5 14 15 14C15.5 14 16 13.81 16.41 13.41C16.81 13 17 12.5 17 12V9C17 8.5 16.81 8 16.41 7.59C16 7.19 15.5 7 15 7M12 15C11.39 15 10.83 15.32 10.41 15.73L8.5 17.64C7.67 18.47 7 19.72 7 21V22H17V21C17 19.72 16.33 18.47 15.5 17.64L13.59 15.73C13.17 15.32 12.61 15 12 15Z"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-teal to-primary-light bg-clip-text text-transparent">
                    365 Days of Weed
                  </h1>
                  <p className="text-xs text-gray-500">Daily Cannabis Education</p>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  to="/"
                  className="relative group px-3 py-2 hover:text-primary transition-colors font-medium"
                >
                  <span>Today</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/calendar"
                  className="relative group px-3 py-2 hover:text-teal transition-colors font-medium"
                >
                  <span>Calendar</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/journal"
                  className="relative group px-3 py-2 hover:text-gold transition-colors font-medium"
                >
                  <span>Journal</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/achievements"
                  className="relative group px-3 py-2 hover:text-purple transition-colors font-medium"
                >
                  <span>Achievements</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/lists"
                  className="relative group px-3 py-2 hover:text-pink transition-colors font-medium"
                >
                  <span>Lists</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink group-hover:w-full transition-all duration-300"></span>
                </Link>
                <StreakBadge userId={1} />
                <ThemeToggle />
                <Link
                  to="/settings"
                  className="p-2 hover:bg-gray-800 rounded-lg transition-all"
                  title="Settings"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/lists/:slug" element={<Lists />} />
          </Routes>
        </main>

        <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t border-gray-800">
          <p>For adults 21+ in legal jurisdictions.</p>
          <p className="mt-2">Educational content only; not medical advice.</p>
        </footer>

        {/* Konami Code Modal */}
        {showKonamiModal && (
          <KonamiModal
            onClose={() => setShowKonamiModal(false)}
            onAwardPoints={awardKonamiPoints}
          />
        )}

        {/* Shake Gesture Modal */}
        {showShakeModal && (
          <ShakeModal
            onClose={() => setShowShakeModal(false)}
            onAwardPoints={awardShakePoints}
          />
        )}

        {/* Triple-Tap Modal */}
        {showTripleTapModal && (
          <TripleTapModal
            onClose={() => setShowTripleTapModal(false)}
            onAwardPoints={awardTripleTapPoints}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
