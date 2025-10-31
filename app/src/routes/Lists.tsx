import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface CuratedList {
  id: number;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  icon_emoji: string;
  featured: boolean;
  view_count: number;
  like_count: number;
  item_count?: number;
  published_at: string;
}

interface ListItem {
  id: number;
  title: string;
  description: string;
  why_high: string;
  meta: any;
  image_url?: string;
  order_position: number;
}

interface ListDetail extends CuratedList {
  items: ListItem[];
  userHasLiked: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

function Lists() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [lists, setLists] = useState<CuratedList[]>([]);
  const [selectedList, setSelectedList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  // const userId = 1; // TODO: Get from auth context (currently unused in grid view)

  // Load all lists or a specific list
  useEffect(() => {
    if (slug) {
      // Load specific list detail
      loadListDetail(slug);
    } else {
      // Load all lists
      loadAllLists();
    }
  }, [slug, filterCategory]);

  const loadAllLists = async () => {
    setLoading(true);
    const url = filterCategory === 'all'
      ? `${API_BASE}/api/lists`
      : `${API_BASE}/api/lists?category=${filterCategory}`;

    const response = await fetch(url);
    const data = await response.json();
    setLists(data.lists || []);

    // Extract unique categories
    const uniqueCategories = [...new Set(data.lists.map((l: CuratedList) => l.category))] as string[];
    setCategories(uniqueCategories);

    setLoading(false);
  };

  const loadListDetail = async (listSlug: string) => {
    setLoading(true);

    // Track view
    const listResponse = await fetch(`${API_BASE}/api/lists/${listSlug}`);
    const listData = await listResponse.json();

    if (listData.error) {
      navigate('/lists');
      return;
    }

    // Track view
    await fetch(`${API_BASE}/api/lists/${listData.id}/view`, { method: 'POST' });

    setSelectedList(listData);
    setLoading(false);
  };

  const toggleLike = async (listId: number) => {
    const response = await fetch(`${API_BASE}/api/lists/${listId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    if (selectedList) {
      setSelectedList({
        ...selectedList,
        userHasLiked: data.liked,
        like_count: selectedList.like_count + (data.liked ? 1 : -1)
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      movies: 'text-purple-400 bg-purple-900/30 border-purple-500',
      music: 'text-teal-400 bg-teal-900/30 border-teal-500',
      food: 'text-orange-400 bg-orange-900/30 border-orange-500',
      activities: 'text-green-400 bg-green-900/30 border-green-500',
      products: 'text-gold-400 bg-gold-900/30 border-gold-500'
    };
    return colors[category] || 'text-gray-400 bg-gray-900/30 border-gray-500';
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      movies: '🎬',
      music: '🎵',
      food: '🍕',
      activities: '🎮',
      products: '🌿'
    };
    return emojis[category] || '📚';
  };

  // Grid view (all lists)
  if (!slug || !selectedList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-purple-950 to-black p-6">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-teal-400 to-purple-400 bg-clip-text text-transparent">
              📚 Curated Lists
            </h1>
            <p className="text-gray-300 text-lg">
              Handpicked collections for your elevated lifestyle
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-6 py-2 rounded-full border-2 transition-all ${
                filterCategory === 'all'
                  ? 'bg-purple-500 border-purple-400 text-white'
                  : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-purple-500'
              }`}
            >
              🌟 All Lists
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-2 rounded-full border-2 transition-all ${
                  filterCategory === cat
                    ? getCategoryColor(cat).replace('text-', 'bg-').replace('/30', '') + ' text-white'
                    : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-purple-500'
                }`}
              >
                {getCategoryEmoji(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-6xl">🌿</div>
              <p className="text-gray-400 mt-4">Loading the good stuff...</p>
            </div>
          )}

          {/* Lists Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.slug}`)}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 border-2 border-gray-800 rounded-2xl p-6 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer group"
                >
                  {/* Badge */}
                  {list.featured && (
                    <div className="inline-block px-3 py-1 bg-gold-500/20 border border-gold-500 rounded-full text-gold-400 text-xs font-bold mb-3">
                      ⭐ FEATURED
                    </div>
                  )}

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">{list.icon_emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                        {list.title}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${getCategoryColor(list.category)}`}>
                        {list.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {list.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>📋</span>
                      <span>{list.item_count || 0} items</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>👁️</span>
                      <span>{list.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>❤️</span>
                      <span>{list.like_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && lists.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌿</div>
              <p className="text-gray-400">No lists found in this category</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail view (single list with items)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-purple-950 to-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/lists')}
          className="mb-6 px-4 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-xl text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-all"
        >
          ← Back to Lists
        </button>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-6xl">🌿</div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        )}

        {!loading && selectedList && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border-2 border-gray-800 rounded-2xl p-8 mb-8">
              <div className="flex items-start gap-6">
                <div className="text-7xl">{selectedList.icon_emoji}</div>
                <div className="flex-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 mb-3 ${getCategoryColor(selectedList.category)}`}>
                    {selectedList.category.toUpperCase()}
                  </span>
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-teal-400 to-purple-400 bg-clip-text text-transparent">
                    {selectedList.title}
                  </h1>
                  <p className="text-gray-300 text-lg mb-6">
                    {selectedList.description}
                  </p>

                  {/* Stats & Like */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span>👁️</span>
                      <span>{selectedList.view_count} views</span>
                    </div>
                    <button
                      onClick={() => toggleLike(selectedList.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        selectedList.userHasLiked
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-red-500'
                      }`}
                    >
                      <span>{selectedList.userHasLiked ? '❤️' : '🤍'}</span>
                      <span>{selectedList.like_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-6">
              {selectedList.items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 border-2 border-gray-800 rounded-2xl p-6 hover:border-purple-500 transition-all"
                >
                  {/* Number Badge */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-300 mb-4">
                        {item.description}
                      </p>

                      {/* Why High */}
                      {item.why_high && (
                        <div className="bg-green-900/20 border-2 border-green-800 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🌿</span>
                            <span className="text-green-400 font-bold">Why It Hits Different</span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            {item.why_high}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      {item.meta && (
                        <div className="flex flex-wrap gap-3 text-sm">
                          {item.meta.year && (
                            <span className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400">
                              📅 {item.meta.year}
                            </span>
                          )}
                          {item.meta.genre && (
                            <span className="px-3 py-1 bg-purple-900/30 border border-purple-700 rounded-lg text-purple-400">
                              🎭 {item.meta.genre}
                            </span>
                          )}
                          {item.meta.director && (
                            <span className="px-3 py-1 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-400">
                              🎬 {item.meta.director}
                            </span>
                          )}
                          {item.meta.where_to_watch && (
                            <span className="px-3 py-1 bg-teal-900/30 border border-teal-700 rounded-lg text-teal-400">
                              📺 {item.meta.where_to_watch}
                            </span>
                          )}
                          {item.meta.runtime && (
                            <span className="px-3 py-1 bg-gold-900/30 border border-gold-700 rounded-lg text-gold-400">
                              ⏱️ {item.meta.runtime}
                            </span>
                          )}
                          {item.meta.standout_tracks && (
                            <span className="px-3 py-1 bg-pink-900/30 border border-pink-700 rounded-lg text-pink-400">
                              🎵 {item.meta.standout_tracks.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Lists;
