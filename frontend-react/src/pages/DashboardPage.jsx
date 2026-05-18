import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookmarks } from '../hooks/useBookmarks'
import BookmarkCard from '../components/BookmarkCard'
import BookmarkModal from '../components/BookmarkModal'
import FloatingActionButton from '../components/FloatingActionButton'
import { FiSearch, FiInbox, FiTag, FiHash } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useMemo } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { bookmarks, loading, error, fetchBookmarks, addBookmark, updateBookmark, deleteBookmark } = useBookmarks()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [allTags, setAllTags] = useState([])

  // Fetch bookmarks on mount only
  useEffect(() => {
    fetchBookmarks('', '')
  }, [fetchBookmarks])

  // Instant frontend filtering
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      const matchesSearch = !searchQuery || 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !activeTag || (b.tags && b.tags.includes(activeTag));
      
      return matchesSearch && matchesTag;
    })
  }, [bookmarks, searchQuery, activeTag])

  // Extract all unique tags
  useEffect(() => {
    const tags = new Set()
    bookmarks.forEach((b) => {
      if (b.tags) {
        b.tags.forEach(t => tags.add(t))
      }
    })
    setAllTags(Array.from(tags).sort())
  }, [bookmarks])

  const handleAdd = () => {
    setEditingBookmark(null)
    setModalOpen(true)
  }

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark)
    setModalOpen(true)
  }

    if (editingBookmark) {
      await updateBookmark(editingBookmark.id, data)
    } else {
      try {
        await addBookmark(data)
      } catch (e) {
        if (e.response?.status === 409) {
          throw new Error("Already bookmarked")
        }
        throw e
      }
    }
    setModalOpen(false)
  }

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Bookmarks</h1>
          <p className="text-sm text-gray-500">Manage and organize your saved links</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 bg-white/70 focus:bg-white focus:border-blue-400 transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Tag Filters */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTag('')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !activeTag
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-white text-gray-600 hover:bg-blue-50 border border-blue-100'
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTag === tag
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-gray-600 hover:bg-blue-50 border border-blue-100'
            }`}
          >
            <FiHash className="w-3.5 h-3.5 opacity-70" />
            {tag}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8">
          Failed to load bookmarks: {error}
        </div>
      )}

      {/* Content */}
      {loading && bookmarks.length === 0 ? (
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
      ) : filteredBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
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
              onClick={() => { setSearchQuery(''); setActiveTag(''); }}
              className="px-6 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredBookmarks.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <BookmarkCard
                  bookmark={bookmark}
                  onEdit={() => handleEdit(bookmark)}
                  onDelete={() => deleteBookmark(bookmark.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FloatingActionButton onClick={handleAdd} />

      <AnimatePresence>
        {modalOpen && (
          <BookmarkModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            initialData={editingBookmark}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
