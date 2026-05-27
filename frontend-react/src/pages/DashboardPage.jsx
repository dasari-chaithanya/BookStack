import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookmarks } from '../hooks/useBookmarks'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../components/Toast'
import { FiBookmark, FiHash } from 'react-icons/fi'

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
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error loading bookmarks</h3>
            <p className="text-gray-500 mb-4 text-sm">{error}</p>
            <button
              onClick={() => fetchBookmarks(debouncedSearch, activeTag)}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-blue-50 overflow-hidden h-52 animate-pulse">
                <div className="h-1 bg-gray-200" />
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded w-full" />
                    <div className="h-2.5 bg-gray-200 rounded w-5/6" />
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <div className="h-5 w-12 bg-gray-200 rounded-full" />
                    <div className="h-5 w-12 bg-gray-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
              <FiBookmark className="w-9 h-9 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {debouncedSearch || activeTag ? 'No bookmarks found' : 'No bookmarks yet'}
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              {debouncedSearch || activeTag
                ? 'Try adjusting your search or tag filter.'
                : 'Click the + button below to save your first link.'}
            </p>
            {(debouncedSearch || activeTag) && (
              <button
                onClick={clearFilters}
                className="px-5 py-2 text-sm font-medium border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
