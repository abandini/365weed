import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCalendar, DayCard } from '../lib/api';
import { isFavorite } from '../lib/favorites';

interface CalendarDay {
  date: string;
  card?: DayCard;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function CalendarEnhanced() {
  const [cards, setCards] = useState<DayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<DayCard | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    try {
      setLoading(true);
      setError(null);
      const result = await getCalendar();
      setCards(result.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function generateCalendarDays(): CalendarDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();

    while (currentDateObj <= endDate) {
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const card = cards.find(c => c.date === dateStr);
      const isCurrentMonth = currentDateObj.getMonth() === month;
      const isToday =
        currentDateObj.getDate() === today.getDate() &&
        currentDateObj.getMonth() === today.getMonth() &&
        currentDateObj.getFullYear() === today.getFullYear();

      days.push({ date: dateStr, card, isCurrentMonth, isToday });
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const getTagIcon = (tags: string): string => {
    const lowerTags = tags.toLowerCase();
    if (lowerTags.includes('indica')) return '🌙';
    if (lowerTags.includes('sativa')) return '☀️';
    if (lowerTags.includes('hybrid')) return '⚡';
    if (lowerTags.includes('cbd')) return '💊';
    if (lowerTags.includes('edible')) return '🍪';
    if (lowerTags.includes('topical')) return '🧴';
    return '🌿';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-8xl animate-float-medium mb-6">📅</div>
        <div className="text-cannabis-glow text-2xl font-display animate-glow-pulse">
          Loading calendar...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="organic-card p-8 border-amber-warm">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-display text-amber-light mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={loadCalendar} className="glow-button">
            Try Again 🔄
          </button>
        </div>
      </div>
    );
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="organic-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl md:text-5xl font-display text-cannabis-glow drop-shadow-glow-green">
            Cannabis Calendar 📅
          </h1>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-forest-900/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-cannabis text-forest-950 shadow-glow-green'
                  : 'text-gray-400 hover:text-cannabis-glow'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-cannabis text-forest-950 shadow-glow-green'
                  : 'text-gray-400 hover:text-cannabis-glow'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-3 hover:bg-cannabis/10 rounded-xl transition-all duration-300
                     hover:scale-110 group"
          >
            <svg className="w-6 h-6 text-gray-400 group-hover:text-cannabis-glow transition-colors"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-display text-white mb-2">
              {monthName}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-amber/20 hover:bg-amber/30 border border-amber/40
                       rounded-xl text-amber-light font-body text-sm
                       transition-all duration-300 hover:scale-105"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className="p-3 hover:bg-cannabis/10 rounded-xl transition-all duration-300
                     hover:scale-110 group"
          >
            <svg className="w-6 h-6 text-gray-400 group-hover:text-cannabis-glow transition-colors"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <section className="organic-card p-4 md:p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center py-2 text-gray-500 font-display text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const hasContent = !!day.card;
              const isFav = day.card && isFavorite(day.card.date);

              return (
                <button
                  key={day.date}
                  onClick={() => {
                    if (day.card) {
                      navigate(`/?date=${day.date}`);
                    }
                  }}
                  disabled={!hasContent}
                  className={`
                    relative aspect-square p-2 rounded-xl transition-all duration-300
                    animate-scale-in
                    ${day.isToday
                      ? 'bg-cannabis/20 border-2 border-cannabis shadow-glow-green'
                      : hasContent
                      ? 'bg-forest-800/50 border border-cannabis/20 hover:bg-cannabis/10 hover:border-cannabis/40 hover:scale-105'
                      : 'bg-forest-900/30 border border-forest-800'
                    }
                    ${!day.isCurrentMonth && 'opacity-40'}
                    ${!hasContent && 'cursor-not-allowed'}
                  `}
                  style={{ animationDelay: `${index * 0.01}s` }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm md:text-base font-body ${
                      day.isToday ? 'text-cannabis-glow font-bold' : 'text-gray-300'
                    }`}>
                      {new Date(day.date).getDate()}
                    </span>

                    {hasContent && day.card && (
                      <div className="text-lg mt-1">
                        {getTagIcon(day.card.tags || '')}
                      </div>
                    )}

                    {isFav && (
                      <div className="absolute top-1 right-1 text-xs">⭐</div>
                    )}

                    {day.isToday && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5
                                    bg-cannabis-glow animate-glow-pulse"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-4 md:grid-cols-2">
          {calendarDays
            .filter(day => day.card && day.isCurrentMonth)
            .map((day, index) => {
              const card = day.card!;
              return (
                <button
                  key={day.date}
                  onClick={() => navigate(`/?date=${day.date}`)}
                  className="organic-card p-6 text-left group hover:scale-[1.02]
                           transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-display text-white group-hover:text-cannabis-glow
                                 transition-colors">
                      {card.title}
                    </h3>
                    {isFavorite(card.date) && (
                      <span className="text-xl">⭐</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-3 font-body">
                    📅 {day.date}
                  </p>

                  {card.tags && (
                    <div className="flex flex-wrap gap-2">
                      {card.tags.split(',').slice(0, 2).map((tag, i) => (
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
                </button>
              );
            })}
        </div>
      )}

      {/* Modal for selected card */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4
                   animate-fade-in"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="organic-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-3xl font-display text-cannabis-glow">
                {selectedCard.title}
              </h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 hover:bg-forest-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <p className="text-gray-400 mb-6">{selectedCard.date}</p>

            <div className="prose prose-invert max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: selectedCard.body_md.replace(/\n/g, '<br/>') }} />
            </div>

            <button
              onClick={() => {
                setSelectedCard(null);
                navigate(`/?date=${selectedCard.date}`);
              }}
              className="glow-button w-full"
            >
              View Full Content →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
