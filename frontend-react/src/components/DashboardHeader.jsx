import { FiHash, FiBookmark } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function DashboardHeader({
  bookmarkCount,
  searchQuery,
  setSearchQuery,
  activeTag,
  setActiveTag,
  allTags,
}) {
  return (
    <div className="mb-8 space-y-5">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <FiBookmark className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Your Bookmarks</h1>
          </div>
          <p className="text-sm text-gray-400 pl-1">
            {bookmarkCount} {bookmarkCount === 1 ? 'link' : 'links'} saved
          </p>
        </div>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            layout
            onClick={() => setActiveTag('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              !activeTag
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-gray-600 hover:bg-blue-50 border border-blue-100'
            }`}
          >
            All
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              layout
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTag === tag
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 hover:bg-blue-50 border border-blue-100'
              }`}
            >
              <FiHash className="w-3 h-3 opacity-70" />
              {tag}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
