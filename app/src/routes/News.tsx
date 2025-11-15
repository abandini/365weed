import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganicLoading from '../components/OrganicLoading';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface NewsArticle {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source_urls: string;
  image_url?: string;
  author: string;
  published_at: string;
  fetch_date: string;
  tags: string;
  view_count: number;
  share_count: number;
  created_at: string;
}

interface NewsCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface NewsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const categoryIcons: Record<string, string> = {
  legal: '⚖️',
  medical: '🧬',
  business: '💼',
  culture: '🎨',
  products: '🔬',
};

export default function News() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<NewsPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [trending, setTrending] = useState<NewsArticle[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchTrending();
  }, []);

  // Fetch articles when filters change
  useEffect(() => {
    if (!slug) {
      fetchArticles();
    }
  }, [selectedCategory, searchQuery, slug]);

  // Fetch single article if slug is present
  useEffect(() => {
    if (slug) {
      fetchArticle(slug);
    }
  }, [slug]);

  // Update document title and meta tags
  useEffect(() => {
    if (selectedArticle) {
      document.title = `${selectedArticle.title} | 365 Days of Weed`;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', selectedArticle.summary || '');
      }

      // Update Open Graph meta tags for social sharing
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', selectedArticle.title);

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute('content', selectedArticle.summary || '');

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && selectedArticle.image_url) {
        ogImage.setAttribute('content', selectedArticle.image_url);
      }
    } else if (!slug) {
      document.title = 'Cannabis News | 365 Days of Weed';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Daily cannabis industry news, research, and updates');
      }
    }

    return () => {
      // Reset title on unmount
      document.title = '365 Days of Weed';
    };
  }, [selectedArticle, slug]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/news/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/news/stats/trending`);
      const data = await response.json();
      setTrending(data.articles?.slice(0, 3) || []);
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    }
  };

  const fetchArticles = async (offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: offset.toString(),
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${API_BASE}/api/news?${params}`);
      const data = await response.json();

      setArticles(data.articles || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticle = async (articleSlug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/news/${articleSlug}`);
      const data = await response.json();
      setSelectedArticle(data.article || null);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      setSelectedArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (article: NewsArticle, platform: string) => {
    try {
      await fetch(`${API_BASE}/api/news/${article.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const shareUrls: Record<string, string> = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      };

      if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      }
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const parseSourceUrls = (sourceUrls: string): string[] => {
    try {
      return JSON.parse(sourceUrls);
    } catch {
      return [];
    }
  };

  // Article detail view
  if (slug && selectedArticle) {
    const sources = parseSourceUrls(selectedArticle.source_urls || '[]');
    const categoryColor = categories.find(c => c.slug === selectedArticle.category)?.color || '#4ade80';

    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/news')}
            className="mb-6 flex items-center gap-2 text-cannabis-green hover:text-cannabis-bright transition-colors"
          >
            <span>←</span>
            <span className="font-grotesk">Back to News</span>
          </button>

          {/* Article header */}
          <article className="organic-card p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="px-4 py-1 rounded-full text-sm font-grotesk font-medium"
                style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
              >
                {categoryIcons[selectedArticle.category]} {selectedArticle.category}
              </span>
              <span className="text-sm text-gray-400 font-grotesk">
                {formatDate(selectedArticle.published_at)}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display mb-4 bg-gradient-to-r from-cannabis-green via-cannabis-bright to-amber-400 bg-clip-text text-transparent leading-tight">
              {selectedArticle.title}
            </h1>

            {selectedArticle.image_url && (
              <img
                src={selectedArticle.image_url}
                alt={selectedArticle.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <p className="text-lg text-gray-300 font-grotesk mb-6 leading-relaxed">
              {selectedArticle.summary}
            </p>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-forest-700">
              <div className="flex items-center gap-4 text-sm text-gray-400 font-grotesk">
                <span className="flex items-center gap-1">
                  👁️ {selectedArticle.view_count.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  🔗 {selectedArticle.share_count.toLocaleString()} shares
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleShare(selectedArticle, 'twitter')}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-700 rounded-lg transition-all"
                  aria-label="Share on Twitter"
                >
                  🐦
                </button>
                <button
                  onClick={() => handleShare(selectedArticle, 'facebook')}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-700 rounded-lg transition-all"
                  aria-label="Share on Facebook"
                >
                  📘
                </button>
                <button
                  onClick={() => handleShare(selectedArticle, 'linkedin')}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-700 rounded-lg transition-all"
                  aria-label="Share on LinkedIn"
                >
                  💼
                </button>
              </div>
            </div>

            {/* Article content */}
            <div
              className="prose prose-invert prose-lg max-w-none font-grotesk
                prose-headings:font-display prose-headings:text-cannabis-bright
                prose-p:text-gray-300 prose-p:leading-relaxed
                prose-a:text-cannabis-green prose-a:no-underline hover:prose-a:text-cannabis-bright
                prose-strong:text-cannabis-bright
                prose-ul:text-gray-300 prose-ol:text-gray-300
                prose-li:marker:text-cannabis-green"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br />') }}
            />

            {/* Sources */}
            {sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-forest-700">
                <h3 className="text-xl font-display text-cannabis-bright mb-4">Sources</h3>
                <ul className="space-y-2">
                  {sources.map((url, idx) => (
                    <li key={idx}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cannabis-green hover:text-cannabis-bright transition-colors font-grotesk text-sm break-all"
                      >
                        🔗 {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {selectedArticle.tags && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-forest-800 text-cannabis-green rounded-full text-sm font-grotesk"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    );
  }

  // Article list view
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-display mb-4 bg-gradient-to-r from-cannabis-green via-cannabis-bright to-amber-400 bg-clip-text text-transparent">
            Cannabis News 📰
          </h1>
          <p className="text-xl text-gray-300 font-grotesk max-w-2xl mx-auto">
            Stay informed with the latest cannabis industry news, research, and updates
          </p>
        </div>

        {/* Trending articles */}
        {trending.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display text-cannabis-bright mb-4 flex items-center gap-2">
              🔥 Trending Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trending.map((article) => {
                const categoryColor = categories.find(c => c.slug === article.category)?.color || '#4ade80';
                return (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/news/${article.slug}`)}
                    className="organic-card p-6 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-grotesk font-medium mb-3"
                      style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
                    >
                      {categoryIcons[article.category]} {article.category}
                    </span>
                    <h3 className="font-display text-lg text-cannabis-bright mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-400 font-grotesk line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-grotesk">
                      <span>👁️ {article.view_count}</span>
                      <span>🔗 {article.share_count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-6 py-2 rounded-full font-grotesk transition-all ${
                selectedCategory === ''
                  ? 'bg-cannabis-green text-forest-950 shadow-glow-green'
                  : 'bg-forest-800 text-gray-300 hover:bg-forest-700'
              }`}
            >
              All News
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-6 py-2 rounded-full font-grotesk transition-all ${
                  selectedCategory === category.slug
                    ? 'bg-cannabis-green text-forest-950 shadow-glow-green'
                    : 'bg-forest-800 text-gray-300 hover:bg-forest-700'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search articles... 🔍"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 bg-forest-800 border-2 border-forest-700 rounded-lg
              text-gray-100 placeholder-gray-500 font-grotesk
              focus:border-cannabis-green focus:outline-none focus:shadow-glow-green
              transition-all"
          />
        </div>

        {/* Loading state */}
        {loading && <OrganicLoading />}

        {/* Articles grid */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const categoryColor = categories.find(c => c.slug === article.category)?.color || '#4ade80';
              return (
                <div
                  key={article.id}
                  onClick={() => navigate(`/news/${article.slug}`)}
                  className="organic-card p-6 cursor-pointer hover:scale-105 transition-transform group"
                >
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-lg mb-4 group-hover:opacity-80 transition-opacity"
                    />
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-grotesk font-medium"
                      style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
                    >
                      {categoryIcons[article.category]} {article.category}
                    </span>
                    <span className="text-xs text-gray-500 font-grotesk">
                      {formatDate(article.published_at)}
                    </span>
                  </div>

                  <h3 className="font-display text-xl text-cannabis-bright mb-2 line-clamp-2 group-hover:text-cannabis-green transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-sm text-gray-400 font-grotesk line-clamp-3 mb-4">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 font-grotesk">
                    <span className="flex items-center gap-1">
                      👁️ {article.view_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      🔗 {article.share_count.toLocaleString()}
                    </span>
                    <span className="text-cannabis-green group-hover:text-cannabis-bright transition-colors">
                      Read more →
                    </span>
                  </div>

                  {article.tags && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {article.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-forest-900 text-cannabis-green rounded text-xs font-grotesk"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl font-display text-gray-400 mb-4">
              No articles found 🤷‍♂️
            </p>
            <p className="text-gray-500 font-grotesk">
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => fetchArticles(pagination.offset + pagination.limit)}
              className="glow-button"
            >
              Load More Articles
            </button>
          </div>
        )}

        {/* RSS Feed Link */}
        <div className="mt-16 text-center">
          <a
            href={`${API_BASE}/api/news/feed/rss`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest-800 hover:bg-forest-700
                     text-cannabis-green hover:text-cannabis-bright rounded-lg transition-all
                     border border-cannabis/20 hover:border-cannabis/40"
          >
            <span className="text-2xl">📡</span>
            <span className="font-grotesk font-medium">Subscribe to RSS Feed</span>
          </a>
          <p className="mt-3 text-sm text-gray-500 font-grotesk">
            Get the latest cannabis news delivered to your feed reader
          </p>
        </div>
      </div>
    </div>
  );
}
