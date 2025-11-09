import { useEffect, useState } from 'react';
import { getCalendar, DayCard } from '../lib/api';
import { sanitizeMarkdown } from '../lib/sanitize';

interface CalendarDay {
  date: string;
  card?: DayCard;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function Calendar() {
  const [cards, setCards] = useState<DayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<DayCard | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Generate calendar grid for current month
  function generateCalendarDays(): CalendarDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday before or on first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // End on Saturday after or on last day
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

      days.push({
        date: dateStr,
        card,
        isCurrentMonth,
        isToday,
      });

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

  function getContentTypeColor(tags: string): string {
    const lowerTags = tags.toLowerCase();
    if (lowerTags.includes('indica')) return 'bg-purple-500';
    if (lowerTags.includes('sativa')) return 'bg-gold-500';
    if (lowerTags.includes('hybrid')) return 'bg-teal-500';
    if (lowerTags.includes('cbd') || lowerTags.includes('medical')) return 'bg-blue-500';
    if (lowerTags.includes('edible')) return 'bg-orange-500';
    if (lowerTags.includes('topical')) return 'bg-pink-500';
    return 'bg-primary';
  }

  async function handleDayClick(day: CalendarDay) {
    if (day.card) {
      setSelectedCard(day.card);
    }
  }

  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={loadCalendar}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-teal/10 rounded-2xl p-6 border border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
              Content Calendar
            </h2>
            <p className="text-gray-400 mt-1">
              {cards.length} days of cannabis education from Oct 2025 - Dec 2026
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-700 rounded-lg transition group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold">{monthName}</h3>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary-light rounded-lg transition text-sm font-medium"
              >
                Today
              </button>
            </div>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-700 rounded-lg transition group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-500 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayNum = new Date(day.date).getDate();
                const hasContent = !!day.card;

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative min-h-[100px] p-2 rounded-lg border transition-all duration-200
                      ${day.isCurrentMonth ? 'bg-gray-800/50' : 'bg-gray-900/30 opacity-50'}
                      ${day.isToday ? 'border-primary ring-2 ring-primary/30' : 'border-gray-700'}
                      ${hasContent ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg hover:scale-105' : 'border-gray-800'}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-sm font-medium mb-1 ${day.isToday ? 'text-primary' : 'text-gray-400'}`}>
                        {dayNum}
                      </div>

                      {hasContent && day.card && (
                        <div className="flex-1 flex flex-col gap-1">
                          <div className={`w-2 h-2 rounded-full ${getContentTypeColor(day.card.tags || '')}`}></div>
                          <div className="text-xs text-gray-300 line-clamp-2 leading-tight">
                            {day.card.title}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* List View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const cardDate = new Date(card.date);
            const isToday = cardDate.toDateString() === new Date().toDateString();

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`
                  group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border
                  hover:border-primary/50 transition-all duration-300 cursor-pointer
                  hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1
                  ${isToday ? 'border-primary ring-2 ring-primary/20' : 'border-gray-700'}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-gray-400 font-medium bg-gray-800/50 px-2 py-1 rounded">
                    {cardDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {isToday && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Today</span>
                  )}
                </div>

                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {card.title}
                </h3>

                {card.tags && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {card.tags.split(',').slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${getContentTypeColor(tag)}`}
                        title={tag.trim()}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No content available yet. Check back soon!
        </div>
      )}

      {/* Selected Card Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-primary/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">{selectedCard.date}</div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
                  {selectedCard.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedCard.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCard.tags.split(',').map((tag, idx) => {
                  const trimmedTag = tag.trim().toLowerCase();
                  let badgeColor = 'bg-primary/20 text-primary-light border-primary/30';

                  if (trimmedTag.includes('indica')) badgeColor = 'bg-purple/20 text-purple-light border-purple/30';
                  else if (trimmedTag.includes('sativa')) badgeColor = 'bg-gold/20 text-gold-light border-gold/30';
                  else if (trimmedTag.includes('hybrid')) badgeColor = 'bg-teal/20 text-teal-light border-teal/30';

                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${badgeColor}`}
                    >
                      {tag.trim()}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="prose prose-invert max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(selectedCard.body_md) }} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Navigate to Today view with this date
                  window.location.href = `/?date=${selectedCard.date}`;
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-xl transition-all"
              >
                View Full Content
              </button>
              <button
                onClick={() => setSelectedCard(null)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
