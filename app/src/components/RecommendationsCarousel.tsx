import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface Recommendation {
  id: number;
  date: string;
  title: string;
  body_md: string;
  tags: string;
}

function RecommendationsCarousel() {
  const userId = 1; // TODO: Get from auth context
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/recommendations/${userId}`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-none w-80 bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>✨</span> Recommended For You
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {recommendations.map((rec) => (
          <Link
            key={rec.id}
            to={`/?date=${rec.date}`}
            className="flex-none w-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-primary/50 transition-all hover:shadow-lg transform hover:-translate-y-1"
          >
            <h4 className="text-lg font-bold mb-2 line-clamp-2">{rec.title}</h4>
            <p className="text-sm text-gray-400 mb-3 line-clamp-3">
              {rec.body_md.substring(0, 150)}...
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {rec.tags.split(',').slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RecommendationsCarousel;
