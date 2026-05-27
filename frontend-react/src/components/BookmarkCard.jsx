import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCopy, FiExternalLink, FiEdit2, FiTrash2, FiLink, FiMoreVertical } from 'react-icons/fi'
import { useToast } from './Toast'
import { getFaviconUrl, getDomainName } from '../utils/formatters'

export default function BookmarkCard({ bookmark, onEdit, onDelete }) {
  const { addToast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const menuBtnRef = useRef(null)

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !menuBtnRef.current?.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmark.url)
      .then(() => addToast('URL copied to clipboard!', 'success'))
      .catch(() => addToast('Failed to copy URL.', 'error'))
  }

  const handleVisit = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  const favicon = bookmark.favicon_url || getFaviconUrl(bookmark.url)
  const domain = getDomainName(bookmark.url)

  // Tag truncation
  const maxTags = 3
  const visibleTags = bookmark.tags ? bookmark.tags.slice(0, maxTags) : []
  const remainingTags = bookmark.tags ? bookmark.tags.length - maxTags : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="bg-surface-elevated rounded-xl border border-border-subtle overflow-hidden flex flex-col h-full shadow-card hover:border-border-strong transition-all duration-150 relative group"
    >
      {/* Top accent bar or Preview Image */}
      {bookmark.image_url ? (
        <div className="h-32 w-full overflow-hidden bg-surface-hover border-b border-border-subtle flex-shrink-0">
          <img src={bookmark.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      ) : (
        <div className="h-1 bg-brand-primary flex-shrink-0" />
      )}

      <div style={{ padding: 'var(--spacing-card-p)' }} className="flex flex-col gap-3 flex-1 min-h-0">
        {/* Header: favicon + title */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-strong flex items-center justify-center flex-shrink-0 overflow-hidden">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="w-4 h-4 object-contain"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
            ) : null}
            <FiLink className="w-3.5 h-3.5 text-text-muted" style={{ display: favicon ? 'none' : 'block' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-1 mb-0.5">
              {bookmark.title}
            </h3>
            <p className="text-xs text-text-muted truncate">{domain}</p>
          </div>
        </div>

        {/* Description */}
        {bookmark.notes && (
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
            {bookmark.notes}
          </p>
        )}

        {/* URL */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-primary hover:text-brand-hover truncate block transition-colors"
        >
          {bookmark.url}
        </a>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
            {visibleTags.map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-hover text-text-secondary border border-border-subtle truncate max-w-[120px]" title={tag}>
                {tag}
              </span>
            ))}
            {remainingTags > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-base text-text-muted border border-border-subtle">
                +{remainingTags}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-border-subtle mt-auto">
          <button
            onClick={handleCopy}
            title="Copy URL"
            aria-label="Copy URL"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-150 outline-none"
          >
            <FiCopy className="w-3.5 h-3.5" />
            Copy
          </button>
          <button
            onClick={handleVisit}
            title="Visit URL"
            aria-label="Visit URL"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-150 outline-none"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Visit
          </button>
          
          <div className="flex-1" />
          
          {/* Three-dot menu */}
          <div className="relative">
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More actions"
              aria-expanded={menuOpen}
              className={`p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none ${menuOpen ? 'bg-surface-hover text-text-primary' : ''}`}
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 bottom-full mb-1 w-36 bg-surface-overlay rounded-xl shadow-overlay border border-border-strong overflow-hidden p-1 z-10 origin-bottom-right"
                >
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(bookmark) }}
                    className="menu-item"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(bookmark.id) }}
                    className="menu-item-danger"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
