import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookmarks } from '../hooks/useBookmarks'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../components/Toast'
import { FiBookmark } from 'react-icons/fi'

import BookmarkCard from '../components/BookmarkCard'
import BookmarkModal from '../components/BookmarkModal'
import FloatingActionButton from '../components/FloatingActionButton'
import DashboardHeader from '../components/DashboardHeader'

export default function DashboardPage() {
  const { bookmarks, loading, error, fetchBookmarks, addBookmark, updateBookmark, deleteBookmark } = useBookmarks()
  const { addToast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 350)

  // Derive all unique tags from loaded bookmarks
  const allTags = [...new Set(bookmarks.flatMap((b) => b.tags || []))].sort()

  // Fetch whenever filters change
  useEffect(() => {
    fetchBookmarks(debouncedSearch, activeTag)
  }, [debouncedSearch, activeTag, fetchBookmarks])

  const handleAdd = () => {
    setEditingBookmark(null)
    setModalOpen(true)
  }

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    try {
      if (editingBookmark) {
        await updateBookmark(editingBookmark.id, data)
        addToast('Bookmark updated!', 'success')
      } else {
        await addBookmark(data)
        addToast('Bookmark saved!', 'success')
      }
      setModalOpen(false)
    } catch (e) {
      addToast(e.message, 'error')
      throw e
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteBookmark(id)
      addToast('Bookmark deleted.', 'info')
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setActiveTag('')
  }

  return (
    <div className="pb-24 min-h-full">
      {/* Use spacing token for vertical rhythm */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 'var(--spacing-container)', paddingBottom: 'var(--spacing-container)' }}>
        {/* Header */}
        <DashboardHeader
          bookmarkCount={bookmarks.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          allTags={allTags}
        />

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Error loading bookmarks</h3>
            <p className="text-text-muted mb-4 text-sm">{error}</p>
            <button
              onClick={() => fetchBookmarks(debouncedSearch, activeTag)}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 'calc(var(--spacing-card-p) * 1.5)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface-elevated rounded-xl border border-border-subtle overflow-hidden h-52 animate-pulse shadow-card">
                <div className="h-1 bg-border-strong" />
                <div style={{ padding: 'var(--spacing-card-p)' }} className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-hover flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 bg-surface-hover rounded w-3/4" />
                      <div className="h-2.5 bg-surface-hover rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-surface-hover rounded w-full" />
                    <div className="h-2.5 bg-surface-hover rounded w-5/6" />
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <div className="h-5 w-12 bg-surface-hover rounded-full" />
                    <div className="h-5 w-12 bg-surface-hover rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mb-5 border border-border-strong shadow-card text-text-muted">
              <FiBookmark className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {debouncedSearch || activeTag ? 'No bookmarks found' : 'No bookmarks yet'}
            </h3>
            <p className="text-text-muted text-sm max-w-xs mb-6">
              {debouncedSearch || activeTag
                ? 'Try adjusting your search or tag filter.'
                : 'Click the + button below to save your first link.'}
            </p>
            {(debouncedSearch || activeTag) && (
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          /* Bookmark grid */
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{ gap: 'calc(var(--spacing-card-p) * 1.5)' }}
            >
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEdit}
                  onDelete={() => handleDelete(bookmark.id)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <FloatingActionButton onClick={handleAdd} />

      <BookmarkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={editingBookmark}
      />
    </div>
  )
}
