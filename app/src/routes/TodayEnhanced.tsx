import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getToday, getCalendar, DayCard } from '../lib/api';
import { toggleFavorite, isFavorite } from '../lib/favorites';
import SearchFilter from '../components/SearchFilter';
import OrganicLoading from '../components/OrganicLoading';

export default function TodayEnhanced() {
  const [searchParams] = useSearchParams();
  const [card, setCard] = useState<DayCard | null>(null);
  const [allCards, setAllCards] = useState<DayCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<DayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const dateParam = searchParams.get('date');

  useEffect(() => {
    loadContent();
  }, [dateParam]);

  async function loadContent() {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's highlighted card
      const todayCard = await getToday(dateParam || undefined);
      setCard(todayCard);

      // Fetch all calendar data for search/filter
      const calendarData = await getCalendar();
      setAllCards(calendarData.cards);
      setFilteredCards(calendarData.cards);

      // Extract unique tags
      const tags = new Set<string>();
      calendarData.cards.forEach(c => {
        if (c.tags) {
          c.tags.split(',').forEach(tag => tags.add(tag.trim()));
        }
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    applyFilters(query, activeFilters);
  }

  function handleFilterChange(filters: string[]) {
    setActiveFilters(filters);
    applyFilters(searchQuery, filters);
  }

  function applyFilters(query: string, filters: string[]) {
    let filtered = [...allCards];

    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.body_md.toLowerCase().includes(lowerQuery) ||
        (c.tags && c.tags.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply tag filters
    if (filters.length > 0) {
      filtered = filtered.filter(c => {
        if (!c.tags) return false;
        const cardTags = c.tags.toLowerCase();
        return filters.some(filter => cardTags.includes(filter.toLowerCase()));
      });
    }

    setFilteredCards(filtered);
  }

  function handleToggleFavorite() {
    if (card) {
      toggleFavorite({
        id: card.date,
        title: card.title,
        date: card.date,
        tags: card.tags || '',
      });
      // Force re-render
      setCard({ ...card });
    }
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

  if (loading) {
    return <OrganicLoading />;
  }

  if (error) {
    return (
      <div className="organic-card p-8 border-amber-warm">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-display text-amber-light mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={loadContent} className="glow-button">
            Try Again 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header - Organic asymmetric layout */}
      <section className="relative animate-fade-in">
        <div className="organic-card p-8 md:p-12 overflow-visible">
          {/* Floating decorative elements */}
          <div className="absolute -top-4 -right-4 text-6xl animate-float-slow opacity-50">
            🍃
          </div>
          <div className="absolute -bottom-4 -left-4 text-5xl animate-float-medium opacity-30">
            💨
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-5xl md:text-6xl font-display text-cannabis-glow mb-3
                             drop-shadow-glow-green leading-tight">
                  365 Days of Weed
                </h1>
                <p className="text-xl md:text-2xl text-amber-light font-handwritten">
                  Your daily dose of dank knowledge ✨
                </p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex flex-wrap gap-4 text-sm font-body">
              <div className="flex items-center gap-2 px-4 py-2 bg-cannabis/10 border border-cannabis/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-cannabis animate-glow-pulse"></span>
                <span className="text-cannabis-glow">Fresh Daily Content</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber/10 border border-amber/30 rounded-full">
                <span className="text-amber">🔬</span>
                <span className="text-amber-light">Science-Backed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <SearchFilter
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        availableTags={availableTags}
      />

      {/* Today's Featured Card */}
      {card && (searchQuery === '' && activeFilters.length === 0) && (
        <section className="animate-slide-up">
          <div className="organic-card p-8 md:p-10 group">
            {/* Header with favorite */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-display text-white mb-2
                             group-hover:text-cannabis-glow transition-colors duration-300">
                  {card.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    📅 {card.date}
                  </span>
                </div>
              </div>

              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                className="p-3 hover:bg-cannabis/10 rounded-xl transition-all duration-300
                         hover:scale-110 active:scale-95 group/fav"
                title={isFavorite(card.date) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span className={`text-3xl transition-all duration-300 ${
                  isFavorite(card.date)
                    ? 'drop-shadow-glow-amber'
                    : 'grayscale opacity-50 group-hover/fav:opacity-100 group-hover/fav:grayscale-0'
                }`}>
                  ⭐
                </span>
              </button>
            </div>

            {/* Content */}
            <article className="prose prose-invert max-w-none prose-lg
                              prose-headings:font-display prose-headings:text-cannabis-glow
                              prose-p:text-gray-300 prose-p:font-body prose-p:leading-relaxed
                              mb-8">
              <div
                dangerouslySetInnerHTML={{
                  __html: card.body_md.replace(/\n/g, '<br/>'),
                }}
              />
            </article>

            {/* Tags */}
            {card.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {card.tags.split(',').map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                             bg-cannabis/10 border border-cannabis/30
                             text-cannabis-glow font-body text-sm
                             hover:bg-cannabis/20 hover:scale-105 transition-all duration-300"
                  >
                    <span>{getTagIcon(tag.trim())}</span>
                    <span>{tag.trim()}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Action Button */}
            {card.actionButton && (
              <div className="p-6 bg-gradient-to-br from-cannabis/5 to-amber/5
                           border border-cannabis/20 rounded-2xl">
                <a
                  href={card.actionButton.links.primary}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-button flex items-center justify-center gap-3 w-full"
                >
                  <span>📍</span>
                  <span>{card.actionButton.text}</span>
                  <span>→</span>
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search Results */}
      {(searchQuery || activeFilters.length > 0) && (
        <section className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-display text-cannabis-glow">
              {filteredCards.length} Results Found
            </h3>
          </div>

          {filteredCards.length === 0 && (
            <div className="organic-card p-12 text-center">
              <div className="text-6xl mb-4">🤷‍♂️</div>
              <p className="text-xl text-gray-400 font-body">
                No matches found. Try adjusting your filters!
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {filteredCards.slice(0, 12).map((resultCard, index) => (
              <a
                key={resultCard.date}
                href={`/?date=${resultCard.date}`}
                className="organic-card p-6 group hover:scale-[1.02] transition-transform duration-300
                         animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-xl font-display text-white group-hover:text-cannabis-glow
                               transition-colors">
                    {resultCard.title}
                  </h4>
                  {isFavorite(resultCard.date) && (
                    <span className="text-xl">⭐</span>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-3 font-body">
                  📅 {resultCard.date}
                </p>

                {resultCard.tags && (
                  <div className="flex flex-wrap gap-1">
                    {resultCard.tags.split(',').slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs
                                 bg-cannabis/10 border border-cannabis/20 rounded-lg
                                 text-cannabis-glow"
                      >
                        {getTagIcon(tag.trim())} {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
