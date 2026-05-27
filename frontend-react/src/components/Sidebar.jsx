import { FiInbox } from 'react-icons/fi'

export default function Sidebar({ 
  folders, 
  activeFolder, 
  setActiveFolder, 
  sidebarOpen 
}) {
  return (
    <div className={`w-full md:w-64 lg:w-72 flex-shrink-0 transition-all ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
      <div className="sticky top-24 space-y-8 bg-white/50 backdrop-blur-md p-4 md:p-0 rounded-2xl md:bg-transparent">
        <div>
          <div className="flex items-center justify-between px-3 mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Collections</h2>
          </div>
          <div className="space-y-1">
            <button 
              onClick={() => setActiveFolder(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-sm transition-colors ${
                activeFolder === null ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiInbox className="w-4 h-4" /> All / Inbox
            </button>
            
            {folders.map(f => (
              <button 
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-sm transition-colors ${
                  activeFolder === f.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center text-lg">{f.icon || '📁'}</span> 
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
