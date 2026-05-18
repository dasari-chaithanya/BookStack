import { motion, AnimatePresence } from 'framer-motion'
import { FiLogOut, FiAlertTriangle, FiLoader } from 'react-icons/fi'
import { useState } from 'react'

export default function LogoutModal({ isOpen, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ duration: 0.28, ease: [0.175, 0.885, 0.32, 1.1] }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent */}
              <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />

              <div className="px-8 py-8 flex flex-col items-center gap-5 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <FiAlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Sign out?</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Are you sure you want to log out of BookStack?
                    You'll need to sign in again to access your bookmarks.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold hover:from-red-600 hover:to-rose-600 disabled:opacity-70 shadow-md hover:shadow-red-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <FiLogOut className="w-4 h-4" />
                        Logout
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
