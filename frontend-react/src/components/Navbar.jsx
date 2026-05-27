import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBookmark, FiChevronDown, FiLogOut, FiMenu, FiX, FiGrid, FiMoon, FiSun
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ onLogoutClick }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
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

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-surface-overlay/80 backdrop-blur-md border-b transition-all duration-300 ${
          scrolled ? 'border-border-strong shadow-overlay' : 'border-border-subtle'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 flex-shrink-0 group outline-none">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-150">
                <FiBookmark className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                BookStack
              </span>
            </Link>

            {/* ── Right section (desktop) ── */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-icon flex items-center gap-2"
                aria-label="Toggle Theme"
              >
                {theme === 'focus' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
              </button>

              {!user ? (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-secondary border-transparent">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Register
                  </Link>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors duration-150 outline-none"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-subtle flex items-center justify-center text-brand-primary text-xs font-bold uppercase">
                      {user.username?.[0] ?? 'U'}
                    </div>
                    <FiChevronDown
                      className={`w-4 h-4 text-text-muted transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 bg-surface-overlay rounded-xl shadow-overlay border border-border-strong overflow-hidden p-1 z-50"
                      >
                        <div className="px-3 py-2.5 mb-1">
                          <p className="text-sm font-semibold text-text-primary truncate">{user.username}</p>
                          <p className="text-xs text-text-muted truncate">{user.email}</p>
                        </div>
                        
                        <div className="h-px bg-border-subtle my-1 mx-2" />

                        <button
                          onClick={() => { setDropdownOpen(false); navigate('/dashboard') }}
                          className="menu-item"
                        >
                          <FiGrid className="w-4 h-4" /> Dashboard
                        </button>
                        
                        <div className="h-px bg-border-subtle my-1 mx-2" />
                        
                        <button
                          onClick={() => { setDropdownOpen(false); onLogoutClick?.() }}
                          className="menu-item-danger"
                        >
                          <FiLogOut className="w-4 h-4" /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Mobile hamburger ── */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={toggleTheme} className="btn-icon">
                {theme === 'focus' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
              </button>
              <button
                className="btn-icon"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-surface-overlay border-b border-border-strong shadow-overlay px-4 py-4 md:hidden overflow-hidden"
          >
            {!user ? (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn-secondary w-full">Login</Link>
                <Link to="/register" className="btn-primary w-full">Register</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-surface-hover rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-brand-subtle flex items-center justify-center flex-shrink-0 text-brand-primary text-sm font-bold uppercase">
                    {user.username?.[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-text-primary truncate">{user.username}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/dashboard') }}
                  className="menu-item"
                >
                  <FiGrid className="w-4 h-4" /> Dashboard
                </button>
                <button
                  onClick={() => { setMobileOpen(false); onLogoutClick?.() }}
                  className="menu-item-danger"
                >
                  <FiLogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
