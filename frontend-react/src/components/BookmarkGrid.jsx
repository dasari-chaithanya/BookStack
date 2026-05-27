import { motion, AnimatePresence } from 'framer-motion'
import { FiInbox, FiChevronDown, FiAlertCircle } from 'react-icons/fi'
import BookmarkCard from './BookmarkCard'

export default function BookmarkGrid({
  bookmarks,
  loading,
  error,
  hasMore,
  loadMore,
  searchQuery,
  activeTag,
  onEdit,
  onDelete,
  clearFilters
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
          <FiAlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error loading bookmarks</h3>
        <p className="text-gray-500 max-w-sm mb-6">{error}</p>
        <button
          onClick={clearFilters}
          className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (loading && bookmarks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-blue-50 overflow-hidden flex flex-col h-48 animate-pulse">
            <div className="h-1 bg-gray-200" />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
          <FiInbox className="w-8 h-8 text-blue-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookmarks found</h3>
        <p className="text-gray-500 max-w-sm mb-6">
          {searchQuery || activeTag 
            ? "We couldn't find any bookmarks matching your filters."
            : "You haven't saved any bookmarks yet. Click the + button to add your first one."}
        </p>
        {(searchQuery || activeTag) && (
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            Clear Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={() => onEdit(bookmark)}
              onDelete={() => onDelete(bookmark.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Loading...' : 'Load More'}
            {!loading && <FiChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
