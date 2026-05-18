import { Link } from 'react-router-dom'
import { FiBookmark, FiGithub, FiTwitter } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-blue-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-blue-300 transition-shadow">
              <FiBookmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">BookStack</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">Login</Link>
            <Link to="/register" className="hover:text-blue-600 transition-colors">Register</Link>
          </div>

          {/* Copy */}
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BookStack. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
