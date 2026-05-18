import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useToast } from './components/Toast'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import Navbar from './components/Navbar'

function App() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()

  useEffect(() => {
    const handleAuthExpired = () => {
      logout()
      addToast('Session expired. Please log in again.', 'error')
      navigate('/login')
    }
    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [logout, navigate, addToast])

  if (loading) {
    return <div className="min-h-screen bg-[#eaf7fb] flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#eaf7fb] text-gray-900 font-sans">
      <Navbar />
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
