import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBookmark, FiSearch, FiUser, FiChevronDown,
  FiLogOut, FiSettings, FiMenu, FiX
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onLogoutClick, searchValue, onSearchChange }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Navbar shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile on route change
  useEffect(() => setMobileOpen(false), [location])

  const isDashboard = user && location.pathname === '/dashboard'

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 navbar-blur border-b border-blue-50 transition-all duration-300 ${
          scrolled ? 'shadow-md shadow-blue-50' : 'shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md group-hover:shadow-blue-300 transition-shadow duration-300">
                <FiBookmark className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                BookStack
              </span>
            </Link>

            {/* ── Center Search (dashboard only) ── */}
            {isDashboard && (
              <div className="hidden md:flex flex-1 mx-6">
                <div className="relative w-full max-w-lg mx-auto">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookmarks..."
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50/50 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-400"
                  />
                </div>
              </div>
            )}

            {/* Spacer when no search */}
            {!isDashboard && <div className="flex-1" />}

            {/* ── Right section ── */}
            <div className="hidden md:flex items-center gap-3">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 rounded-xl hover:bg-blue-50 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-blue-300 transition-all duration-200"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold uppercase">
                        {user.username?.[0] ?? 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user.username}
                    </span>
                    <FiChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0,  scale: 1 }}
                        exit={{   opacity: 0, y: -8,  scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden py-1"
                      >
                        <button
                          disabled
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed opacity-60"
                        >
                          <FiUser className="w-4 h-4" /> Profile
                        </button>
                        <button
                          disabled
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed opacity-60"
                        >
                          <FiSettings className="w-4 h-4" /> Settings
                        </button>
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onClick={() => { setDropdownOpen(false); onLogoutClick?.() }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150"
                        >
                          <FiLogOut className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden ml-auto p-2 rounded-xl hover:bg-blue-50 transition-colors duration-200"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen
                ? <FiX className="w-5 h-5 text-gray-700" />
                : <FiMenu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-blue-100 shadow-xl px-4 py-4 md:hidden"
          >
            {isDashboard && (
              <div className="relative mb-4">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50/50 text-sm"
                />
              </div>
            )}

            {!user ? (
              <div className="flex flex-col gap-2">
                <Link to="/login"
                  className="py-2.5 text-center text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="py-2.5 text-center text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <span className="text-white text-sm font-bold uppercase">{user.username?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">Logged in</p>
                  </div>
                </div>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 opacity-60 cursor-not-allowed">
                  <FiUser className="w-4 h-4" /> Profile
                </button>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 opacity-60 cursor-not-allowed">
                  <FiSettings className="w-4 h-4" /> Settings
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => { setMobileOpen(false); onLogoutClick?.() }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <FiLogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
