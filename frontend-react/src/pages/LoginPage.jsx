import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiBookmark, FiLoader, FiArrowRight } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required.'
    if (!form.password)        errs.password = 'Password is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await login(form.username, form.password)
      addToast('Welcome back! 🎉', 'success')
      navigate('/dashboard')
    } catch (err) {
      setErrors({ submit: err.message })
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((ex) => ({ ...ex, [key]: undefined, submit: undefined }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 pt-24 bg-surface-base">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-surface-elevated rounded-2xl shadow-overlay border border-border-strong overflow-hidden">
          {/* Top accent strip */}
          <div className="h-1 bg-brand-primary" />

          <div className="px-8 py-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm mb-4">
                <FiBookmark className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
              <p className="text-sm text-text-muted mt-1">Sign in to your BookStack account</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={set('username')}
                    placeholder="Your username"
                    autoComplete="username"
                    className={`input-base pl-10 ${errors.username ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className={`input-base pl-10 pr-11 ${errors.password ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {errors.submit}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to register */}
            <p className="text-sm text-text-muted text-center mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-primary font-semibold hover:text-brand-hover transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
