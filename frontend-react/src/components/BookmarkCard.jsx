import { motion, AnimatePresence } from 'framer-motion'
import { FiCopy, FiExternalLink, FiEdit2, FiTrash2, FiLink } from 'react-icons/fi'
import { useToast } from './Toast'

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

function getDomainName(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export default function BookmarkCard({ bookmark, onEdit, onDelete }) {
  const { addToast } = useToast()

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      {/* Top accent bar or Preview Image */}
      {bookmark.image_url ? (
        <div className="h-32 w-full overflow-hidden bg-gray-100 border-b border-blue-50">
          <img src={bookmark.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header: favicon + title */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
            ) : null}
            <FiLink className="w-4 h-4 text-blue-400" style={{ display: favicon ? 'none' : 'block' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 mb-0.5">
              {bookmark.title}
            </h3>
            <p className="text-xs text-gray-400 truncate">{domain}</p>
          </div>
        </div>

        {/* Description */}
        {bookmark.notes && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {bookmark.notes}
          </p>
        )}

        {/* URL */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-700 truncate block transition-colors"
        >
          {bookmark.url}
        </a>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {bookmark.tags.map((tag) => (
              <span key={tag} className="tag-pill max-w-full truncate inline-block" title={tag}>{tag}</span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
          <button
            onClick={handleCopy}
            title="Copy URL"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            <FiCopy className="w-3.5 h-3.5" />
            Copy
          </button>
          <button
            onClick={handleVisit}
            title="Visit URL"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Visit
          </button>
          <div className="flex-1" />
          <button
            onClick={() => onEdit(bookmark)}
            title="Edit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(bookmark)}
            title="Delete"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}
