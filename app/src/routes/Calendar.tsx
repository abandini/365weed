import { useEffect, useState } from 'react';
import { getCalendar, DayCard } from '../lib/api';

export default function Calendar() {
  const [cards, setCards] = useState<DayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading calendar...</div>
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
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Calendar</h2>
        <p className="text-gray-400">
          Browse all daily cannabis education content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-primary/50 transition cursor-pointer"
          >
            <div className="text-sm text-gray-400 mb-2">{card.date}</div>
            <h3 className="font-semibold mb-2">{card.title}</h3>
            {card.slug && (
              <div className="text-xs text-primary/70">{card.slug}</div>
            )}
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No content available yet. Check back soon!
        </div>
      )}
    </div>
  );
}
