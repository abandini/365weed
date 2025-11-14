import { useState } from 'react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: string[]) => void;
  availableTags: string[];
}

export default function SearchFilter({ onSearch, onFilterChange, availableTags }: SearchFilterProps) {
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const toggleFilter = (tag: string) => {
    const newFilters = selectedFilters.includes(tag)
      ? selectedFilters.filter(f => f !== tag)
      : [...selectedFilters, tag];

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setQuery('');
    onSearch('');
    onFilterChange([]);
  };

  const getTagIcon = (tag: string): string => {
    const lower = tag.toLowerCase();
    if (lower.includes('indica')) return '🌙';
    if (lower.includes('sativa')) return '☀️';
    if (lower.includes('hybrid')) return '⚡';
    if (lower.includes('cbd')) return '💊';
    if (lower.includes('edible')) return '🍪';
    if (lower.includes('topical')) return '🧴';
    if (lower.includes('strain')) return '🌿';
    if (lower.includes('terpene')) return '🔬';
    return '✨';
  };

  return (
    <div className="organic-card p-6 space-y-4 animate-fade-in">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cannabis-glow text-xl">
          🔍
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search cannabis content..."
          className="w-full pl-12 pr-4 py-4 bg-forest-900/50 border-2 border-cannabis/20 rounded-2xl
                   text-gray-100 placeholder-gray-500 font-body
                   focus:border-cannabis focus:outline-none focus:ring-2 focus:ring-cannabis/30
                   transition-all duration-300"
        />
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 bg-forest-800/50 hover:bg-forest-700/50
                 border border-amber/30 rounded-xl transition-all duration-300
                 hover:border-amber hover:shadow-glow-amber"
      >
        <span className="text-amber text-lg">
          {showFilters ? '🔽' : '▶️'}
        </span>
        <span className="text-amber font-display text-sm">
          Filter by Topic {selectedFilters.length > 0 && `(${selectedFilters.length})`}
        </span>
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const isSelected = selectedFilters.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleFilter(tag)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm
                    transition-all duration-300 transform hover:scale-105
                    ${isSelected
                      ? 'bg-cannabis text-forest-950 border-2 border-cannabis-glow shadow-glow-green'
                      : 'bg-forest-800/50 text-gray-300 border border-cannabis/20 hover:border-cannabis/50'
                    }
                  `}
                >
                  <span>{getTagIcon(tag)}</span>
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>

          {/* Clear Button */}
          {(selectedFilters.length > 0 || query) && (
            <button
              onClick={clearFilters}
              className="w-full py-3 bg-earth-brown/30 hover:bg-earth-brown/50
                       border border-earth-clay/50 rounded-xl text-amber-light font-display
                       transition-all duration-300 hover:shadow-glow-amber"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {selectedFilters.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Active filters:</span>
          <div className="flex flex-wrap gap-1">
            {selectedFilters.map(filter => (
              <span
                key={filter}
                className="px-2 py-1 bg-cannabis/20 text-cannabis-glow rounded-lg border border-cannabis/30"
              >
                {getTagIcon(filter)} {filter}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
