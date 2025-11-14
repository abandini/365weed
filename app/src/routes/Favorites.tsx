import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFavorite, Favorite } from '../lib/favorites';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  function loadFavorites() {
    const faves = getFavorites();
    setFavorites(faves);
  }

  function handleRemove(date: string) {
    removeFavorite(date);
    loadFavorites();
  }

  function navigateToContent(date: string) {
    navigate(`/?date=${date}`);
  }

  const getTagIcon = (tag: string): string => {
    const lower = tag.toLowerCase();
    if (lower.includes('indica')) return '🌙';
    if (lower.includes('sativa')) return '☀️';
    if (lower.includes('hybrid')) return '⚡';
    if (lower.includes('cbd')) return '💊';
    if (lower.includes('edible')) return '🍪';
    if (lower.includes('topical')) return '🧴';
    return '🌿';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <section className="organic-card p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-display text-cannabis-glow mb-2 drop-shadow-glow-green">
              Your Favorites ⭐
            </h1>
            <p className="text-gray-400 font-body text-lg">
              {favorites.length} saved {favorites.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="text-6xl animate-float-slow">
            💚
          </div>
        </div>
      </section>

      {/* Empty State */}
      {favorites.length === 0 && (
        <div className="organic-card p-12 text-center animate-scale-in">
          <div className="text-7xl mb-6 animate-float-medium">
            🌿
          </div>
          <h2 className="text-3xl font-display text-amber-light mb-4">
            No favorites yet!
          </h2>
          <p className="text-gray-400 font-body text-lg max-w-md mx-auto mb-8">
            Start building your collection by saving your favorite cannabis content.
            Hit the star icon on any daily card to save it here!
          </p>
          <button
            onClick={() => navigate('/')}
            className="glow-button"
          >
            Explore Content 🚀
          </button>
        </div>
      )}

      {/* Favorites Grid */}
      {favorites.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {favorites.map((favorite, index) => (
            <div
              key={favorite.date}
              className="organic-card p-6 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-display text-white group-hover:text-cannabis transition-colors">
                  {favorite.title}
                </h3>
                <button
                  onClick={() => handleRemove(favorite.date)}
                  className="p-2 hover:bg-earth-brown/30 rounded-lg transition-all duration-300
                           hover:scale-110 active:scale-95"
                  title="Remove from favorites"
                >
                  <span className="text-2xl">⭐</span>
                </button>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                <span>📅</span>
                <span className="font-body">{favorite.date}</span>
              </div>

              {/* Tags */}
              {favorite.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {favorite.tags.split(',').slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1
                               bg-cannabis/10 border border-cannabis/30 rounded-full
                               text-cannabis-glow text-sm font-body"
                    >
                      <span>{getTagIcon(tag.trim())}</span>
                      <span>{tag.trim()}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* View Button */}
              <button
                onClick={() => navigateToContent(favorite.date)}
                className="w-full py-3 bg-gradient-to-r from-cannabis/20 to-cannabis-bright/20
                         hover:from-cannabis/30 hover:to-cannabis-bright/30
                         border border-cannabis/40 hover:border-cannabis
                         rounded-xl font-display text-cannabis-glow
                         transition-all duration-300 hover:shadow-glow-green
                         flex items-center justify-center gap-2"
              >
                <span>View Content</span>
                <span>→</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
