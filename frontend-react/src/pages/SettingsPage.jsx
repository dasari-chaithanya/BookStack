import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiCalendar, FiDownload, FiUpload, FiMoon, FiTrash2, FiLogOut } from 'react-icons/fi'
import { useToast } from '../components/Toast'
import client from '../api/client'
import { useRef } from 'react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const fileInputRef = useRef(null)

  const handleExport = async () => {
    try {
      addToast('Exporting bookmarks...', 'info')
      const res = await client.get('/api/export')
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookstack_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      addToast('Export completed successfully!', 'success')
    } catch (err) {
      addToast('Failed to export bookmarks.', 'error')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.html')) {
      addToast('Only HTML bookmark files are supported.', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      addToast('Importing bookmarks... This may take a moment.', 'info')
      const res = await client.post('/api/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const summary = res.data.data
      addToast(`Imported ${summary.imported}. Skipped ${summary.skipped_duplicates} duplicates.`, 'success')
    } catch (err) {
      addToast('Failed to import bookmarks.', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Profile Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-3xl font-bold uppercase">{user?.username?.[0] ?? 'U'}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{user?.username}</h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <FiMail className="w-4 h-4" />
                  {user?.email || 'No email provided'}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <FiCalendar className="w-4 h-4" />
                  Account created recently
                </div>
              </div>
            </div>

            {/* Preferences Placeholder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <FiMoon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Dark Mode</p>
                      <p className="text-xs text-gray-500">Switch to a darker theme</p>
                    </div>
                  </div>
                  <button disabled className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-400 text-xs font-semibold cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Data</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FiDownload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Export Bookmarks</p>
                      <p className="text-xs text-gray-500">Download your data as JSON</p>
                    </div>
                  </div>
                  <button onClick={handleExport} className="px-4 py-1.5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600 text-xs font-semibold cursor-pointer">
                    Export JSON
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <FiUpload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Import Bookmarks</p>
                      <p className="text-xs text-gray-500">Import from HTML file</p>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".html" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors text-indigo-600 text-xs font-semibold cursor-pointer">
                    Upload HTML
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
              
              <button 
                onClick={() => {
                  logout();
                  addToast('Logged out successfully', 'success')
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <FiLogOut className="w-4 h-4" />
                Sign Out
              </button>

              <div className="pt-4 border-t border-red-100">
                <p className="text-xs text-red-400 mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button 
                  onClick={() => addToast('Account deletion is not available in this preview', 'error')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
