import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiBookmark, FiLink, FiTag, FiFileText, FiLoader } from 'react-icons/fi'

const EMPTY = { title: '', url: '', description: '', tags: '' }

export default function BookmarkModal({ isOpen, onClose, onSave, editData = null }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || '',
        url: editData.url || '',
        description: editData.notes || '',
        tags: editData.tags ? editData.tags.join(', ') : '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [editData, isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!form.url.trim()) {
      errs.url = 'URL is required.'
    } else {
      try { new URL(form.url) } catch { errs.url = 'Enter a valid URL (include https://).' }
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, Icon, placeholder, type = 'text') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          value={form[name]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [name]: e.target.value }))
            setErrors((e2) => ({ ...e2, [name]: undefined }))
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 ${
            errors[name] ? 'border-red-400 bg-red-50' : 'border-blue-100 bg-blue-50/40 focus:bg-white focus:border-blue-400'
          }`}
        />
      </div>
      {errors[name] && (
        <p className="text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-2xl border border-blue-50 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <FiBookmark className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {editData ? 'Edit Bookmark' : 'Add Bookmark'}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {editData ? 'Update your bookmark details' : 'Save a new link to your collection'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                {field('title', 'Title', FiBookmark, 'e.g. React Documentation')}
                {field('url', 'URL', FiLink, 'https://example.com', 'url')}

                {/* Description (textarea) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Description <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="What's this link about?"
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-400 resize-none"
                    />
                  </div>
                </div>

                {field('tags', 'Tags', FiTag, 'AI, Design, Tools (comma separated)')}

                {errors.submit && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {errors.submit}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-70 shadow-md hover:shadow-blue-300 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editData ? 'Update Bookmark' : 'Save Bookmark'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
