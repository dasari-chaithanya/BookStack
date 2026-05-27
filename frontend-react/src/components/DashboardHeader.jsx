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
    <div className="mb-6 space-y-4">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-sm">
              <FiBookmark className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Your Bookmarks</h1>
          </div>
          <p className="text-sm text-text-muted pl-1">
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
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
              !activeTag
                ? 'bg-text-primary text-surface-base shadow-sm'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-strong'
            }`}
          >
            All
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              layout
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                activeTag === tag
                  ? 'bg-text-primary text-surface-base shadow-sm'
                  : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-strong'
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
