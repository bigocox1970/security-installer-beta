import React from 'react';
import { Search, X } from 'lucide-react';

interface PostFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  searchQuery: string;
  onCategoryChange: (category: string | null) => void;
  onSearchChange: (query: string) => void;
}

function PostFilters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: PostFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search posts..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category Filters */}
        <div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
                {selectedCategory === category && (
                  <X className="w-4 h-4 ml-1.5 -mr-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
              <div className="inline-flex items-center ml-2 space-x-2">
                {selectedCategory && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    Category: {selectedCategory}
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    Search: {searchQuery}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                onCategoryChange(null);
                onSearchChange('');
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostFilters;