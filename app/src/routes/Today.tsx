import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getToday, getAds, trackAd, DayCard, Ad } from '../lib/api';
import AchievementModal from '../components/AchievementModal';
import CommunityStats from '../components/CommunityStats';
import RecommendationsCarousel from '../components/RecommendationsCarousel';

export default function Today() {
  const [searchParams] = useSearchParams();
  const [card, setCard] = useState<DayCard | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState<any>(null);
  const dateParam = searchParams.get('date');

  useEffect(() => {
    loadContent();
    checkInForStreak();
  }, [dateParam]);

  async function checkInForStreak() {
    const userId = 1; // TODO: Get from auth context
    const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

    try {
      const response = await fetch(`${API_BASE}/api/streaks/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const result = await response.json();

      // Check if any new achievements were unlocked
      if (result.new_achievements && result.new_achievements.length > 0) {
        // Show modal for first achievement
        setNewAchievement(result.new_achievements[0]);
      }
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  }

  async function loadContent() {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's card (or specific date if provided)
      const todayCard = await getToday(dateParam || undefined);
      setCard(todayCard);

      // Fetch ads (try to get user's state from localStorage)
      const state = localStorage.getItem('user_state') || undefined;
      const adsResult = await getAds(state);
      setAds(adsResult.items || []);

      // Track ad views
      if (adsResult.items && adsResult.items.length > 0) {
        for (const ad of adsResult.items) {
          trackAd(ad.id, 'view').catch(console.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading today's content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={loadContent}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 via-teal/20 to-primary/10 border border-primary/40">
        <div className="absolute inset-0 bg-cannabis-pattern opacity-30"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-10 h-10 text-primary drop-shadow-glow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C11.5 2 11 2.19 10.59 2.59C10.2 3 10 3.5 10 4V12C10 12.5 10.2 13 10.59 13.41C11 13.81 11.5 14 12 14C12.5 14 13 13.81 13.41 13.41C13.81 13 14 12.5 14 12V4C14 3.5 13.81 3 13.41 2.59C13 2.19 12.5 2 12 2M9 7C8.5 7 8 7.19 7.59 7.59C7.2 8 7 8.5 7 9V12C7 12.5 7.2 13 7.59 13.41C8 13.81 8.5 14 9 14C9.5 14 10 13.81 10.41 13.41C10.81 13 11 12.5 11 12V9C11 8.5 10.81 8 10.41 7.59C10 7.19 9.5 7 9 7M15 7C14.5 7 14 7.19 13.59 7.59C13.2 8 13 8.5 13 9V12C13 12.5 13.2 13 13.59 13.41C14 13.81 14.5 14 15 14C15.5 14 16 13.81 16.41 13.41C16.81 13 17 12.5 17 12V9C17 8.5 16.81 8 16.41 7.59C16 7.19 15.5 7 15 7M12 15C11.39 15 10.83 15.32 10.41 15.73L8.5 17.64C7.67 18.47 7 19.72 7 21V22H17V21C17 19.72 16.33 18.47 15.5 17.64L13.59 15.73C13.17 15.32 12.61 15 12 15Z"/>
            </svg>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Today&apos;s Cannabis Knowledge</h1>
              <p className="text-sm text-gray-300 mt-1">Your daily dose of education, wellness, and discovery</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Fresh Content Daily</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal"></span>
              <span>Science-Backed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold"></span>
              <span>Community Driven</span>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Card */}
      {card && (
        <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-glow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">{card.title}</h2>
            <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">{card.date}</span>
          </div>

          <article className="prose prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: card.body_md.replace(/\n/g, '<br/>'),
              }}
            />
          </article>

          {card.tags && (
            <div className="mt-6 flex flex-wrap gap-2">
              {card.tags.split(',').map((tag) => {
                const trimmedTag = tag.trim().toLowerCase();
                let badgeColor = 'bg-primary/20 text-primary-light border-primary/30';
                let icon = '🌿';

                // Assign colors and icons based on tag type
                if (trimmedTag.includes('indica')) {
                  badgeColor = 'bg-purple/20 text-purple-light border-purple/30';
                  icon = '🌙';
                } else if (trimmedTag.includes('sativa')) {
                  badgeColor = 'bg-gold/20 text-gold-light border-gold/30';
                  icon = '☀️';
                } else if (trimmedTag.includes('hybrid')) {
                  badgeColor = 'bg-teal/20 text-teal-light border-teal/30';
                  icon = '⚡';
                } else if (trimmedTag.includes('cbd') || trimmedTag.includes('medical')) {
                  badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  icon = '💊';
                } else if (trimmedTag.includes('edible')) {
                  badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
                  icon = '🍪';
                } else if (trimmedTag.includes('topical')) {
                  badgeColor = 'bg-pink-500/20 text-pink-300 border-pink-500/30';
                  icon = '🧴';
                }

                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-105 ${badgeColor}`}
                  >
                    <span>{icon}</span>
                    <span>{tag.trim()}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Button */}
          {card.actionButton && (
            <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-teal/5 rounded-xl border border-primary/20">
              <a
                href={card.actionButton.links.primary}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-glow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg
                  className="w-6 h-6 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{card.actionButton.text}</span>
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>

              {/* Additional links */}
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-gray-500">Also search on:</span>
                {card.actionButton.links.weedmaps && (
                  <a
                    href={card.actionButton.links.weedmaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-primary transition-colors font-medium underline decoration-transparent hover:decoration-primary underline-offset-2"
                  >
                    Weedmaps
                  </a>
                )}
                {card.actionButton.links.leafly && (
                  <a
                    href={card.actionButton.links.leafly}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-teal transition-colors font-medium underline decoration-transparent hover:decoration-teal underline-offset-2"
                  >
                    Leafly
                  </a>
                )}
                {card.actionButton.links.google && (
                  <a
                    href={card.actionButton.links.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-gold transition-colors font-medium underline decoration-transparent hover:decoration-gold underline-offset-2"
                  >
                    Google Maps
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Community Stats */}
      <CommunityStats />

      {/* Personalized Recommendations */}
      <RecommendationsCarousel />

      {/* Sponsored Content */}
      {ads.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <span>Sponsored Content</span>
          </div>

          {ads.map((ad) => (
            <a
              key={ad.id}
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAd(ad.id, 'click').catch(console.error)}
              className="group block bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gold/50 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-gold/10 transform hover:-translate-y-1"
            >
              <div className="flex gap-4">
                {ad.image_url && (
                  <div className="relative w-40 h-40 overflow-hidden">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/50"></div>
                  </div>
                )}
                <div className="p-5 flex-1">
                  <h3 className="text-lg font-bold group-hover:text-gold transition-colors">
                    {ad.title}
                  </h3>
                  <div
                    className="text-sm text-gray-400 mt-2 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: ad.body_md }}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                      {ad.sponsor_name}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-500 group-hover:text-gold transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </section>
      )}

      {/* Achievement Unlock Modal */}
      {newAchievement && (
        <AchievementModal
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
    </div>
  );
}
