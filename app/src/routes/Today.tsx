import { useEffect, useState } from 'react';
import { getToday, getAds, trackAd, DayCard, Ad } from '../lib/api';

export default function Today() {
  const [card, setCard] = useState<DayCard | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's card
      const todayCard = await getToday();
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
    <div className="space-y-6">
      {/* Today's Card */}
      {card && (
        <section className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{card.title}</h2>
            <span className="text-sm text-gray-400">{card.date}</span>
          </div>

          <article className="prose prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: card.body_md.replace(/\n/g, '<br/>'),
              }}
            />
          </article>

          {card.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {card.tags.split(',').map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary/20 rounded-full text-sm"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sponsored Content */}
      {ads.length > 0 && (
        <section className="space-y-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Sponsored
          </div>

          {ads.map((ad) => (
            <a
              key={ad.id}
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAd(ad.id, 'click').catch(console.error)}
              className="block bg-gray-800 hover:bg-gray-750 rounded-xl overflow-hidden border border-gray-700 hover:border-primary/50 transition group"
            >
              <div className="flex gap-4">
                {ad.image_url && (
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-32 h-32 object-cover"
                  />
                )}
                <div className="p-4 flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition">
                    {ad.title}
                  </h3>
                  <div
                    className="text-sm text-gray-400 mt-1"
                    dangerouslySetInnerHTML={{ __html: ad.body_md }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {ad.sponsor_name}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
