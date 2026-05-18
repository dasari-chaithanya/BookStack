import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

// ─── Toast Context ────────────────────────────────────────────────
const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3500)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ─── Icons map ────────────────────────────────────────────────────
const icons = {
  success: <FiCheckCircle className="w-5 h-5 text-emerald-500" />,
  error:   <FiAlertCircle className="w-5 h-5 text-red-500" />,
  info:    <FiInfo        className="w-5 h-5 text-blue-500" />,
}

const colors = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200   bg-red-50',
  info:    'border-blue-200  bg-blue-50',
}

// ─── Container ────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none"
      style={{ minWidth: 320 }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -8,   scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${colors[t.type]} max-w-sm w-full`}
          >
            {icons[t.type]}
            <span className="flex-1 text-sm font-medium text-gray-800">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
