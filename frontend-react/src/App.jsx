import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useToast } from './components/Toast'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import Navbar from './components/Navbar'
import LogoutModal from './components/LogoutModal'

function AppContent() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Handle session expiry from axios interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      logout()
      addToast('Session expired. Please log in again.', 'error')
      navigate('/login')
    }
    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [logout, navigate, addToast])

  // Show a simple spinner while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center shadow-md animate-pulse">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </div>
          <p className="text-sm text-text-muted font-medium">Loading BookStack...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onLogoutClick={() => setLogoutModalOpen(true)} />

      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/"          element={!user ? <LandingPage />   : <Navigate to="/dashboard" replace />} />
          <Route path="/login"     element={!user ? <LoginPage />     : <Navigate to="/dashboard" replace />} />
          <Route path="/register"  element={!user ? <RegisterPage />  : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={user  ? <DashboardPage /> : <Navigate to="/login"    replace />} />
          <Route path="*"          element={<Navigate to="/"          replace />} />
        </Routes>
      </main>

      <LogoutModal
        isOpen={logoutModalOpen}
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={async () => {
          await logout()
          setLogoutModalOpen(false)
          addToast('Signed out successfully.', 'info')
          navigate('/')
        }}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
