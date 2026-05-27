import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiBookmark, FiLink, FiTag, FiFileText, FiLoader, FiCheckCircle } from 'react-icons/fi'
import client from '../api/client'

const EMPTY = { title: '', url: '', description: '', tags: '', favicon_url: '', image_url: '' }

export default function BookmarkModal({ isOpen, onClose, onSave, editData = null }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [metadataSuccess, setMetadataSuccess] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || '',
        url: editData.url || '',
        description: editData.notes || '',
        tags: editData.tags ? editData.tags.join(', ') : '',
        favicon_url: editData.favicon_url || '',
        image_url: editData.image_url || '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setMetadataSuccess(false)
  }, [editData, isOpen])

  // Debounced Auto Metadata Fetch
  useEffect(() => {
    if (editData || !form.url) {
      setMetadataSuccess(false)
      return
    }

    let isValidUrl = false
    try {
      new URL(form.url)
      isValidUrl = true
    } catch {
      isValidUrl = false
    }

    if (!isValidUrl) return

    const delayDebounceFn = setTimeout(async () => {
      setFetchingMetadata(true)
      setMetadataSuccess(false)
      try {
        const res = await client.get(`/api/metadata?url=${encodeURIComponent(form.url)}`)
        const meta = res.data.data || {}
        setForm(prev => ({
          ...prev,
          title: prev.title || meta.title || '',
          description: prev.description || meta.description || '',
          favicon_url: meta.favicon_url || '',
          image_url: meta.image_url || ''
        }))
        setMetadataSuccess(true)
      } catch (err) {
        console.error('Failed to fetch metadata:', err)
      } finally {
        setFetchingMetadata(false)
      }
    }, 800)

    return () => clearTimeout(delayDebounceFn)
  }, [form.url, editData])

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
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors[name] ? 'text-red-500' : 'text-text-muted'}`} />
        <input
          type={type}
          value={form[name]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [name]: e.target.value }))
            setErrors((e2) => ({ ...e2, [name]: undefined }))
            if (name === 'url') setMetadataSuccess(false)
          }}
          placeholder={placeholder}
          className={`input-base pl-9 ${name === 'url' ? 'pr-9' : 'pr-3'} ${errors[name] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
        />
        {name === 'url' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {fetchingMetadata && <FiLoader className="w-4 h-4 text-brand-primary animate-spin" />}
            {!fetchingMetadata && metadataSuccess && <FiCheckCircle className="w-4 h-4 text-emerald-500" />}
          </div>
        )}
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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-surface-overlay rounded-2xl shadow-overlay border border-border-strong w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center text-brand-primary">
                    <FiBookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">
                      {editData ? 'Edit Bookmark' : 'Add Bookmark'}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="btn-icon"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
                {field('title', 'Title', FiBookmark, 'e.g. React Documentation')}
                {field('url', 'URL', FiLink, 'https://example.com', 'url')}

                {/* Description (textarea) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Description <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="What's this link about?"
                      rows={3}
                      className="input-base pl-9 resize-none"
                    />
                  </div>
                </div>

                {field('tags', 'Tags', FiTag, 'AI, Design, Tools (comma separated)')}

                {errors.submit && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {errors.submit}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
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
