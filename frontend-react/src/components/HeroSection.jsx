import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiBookmark, FiLink, FiTag, FiStar } from 'react-icons/fi'

// Floating mock bookmark card
function FloatingCard({ title, url, tags, style, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-blue-100 w-56"
      style={style}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <FiLink className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <p className="text-xs font-semibold text-gray-800 truncate">{title}</p>
      </div>
      <p className="text-[10px] text-gray-400 truncate mb-2">{url}</p>
      <div className="flex gap-1 flex-wrap">
        {tags.map((t) => (
          <span key={t} className="tag-pill text-[10px]">{t}</span>
        ))}
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/20 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Text Content ── */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium w-fit mx-auto lg:mx-0"
            >
              <FiStar className="w-4 h-4" />
              Smart Bookmark Manager
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                BookStack!
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0"
            >
              Your smart bookmark manager to keep your links organized and
              accessible — anytime, anywhere.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg hover:shadow-blue-300 hover:bg-blue-700 transition-all duration-300 animate-pulse-glow"
              >
                Get Started
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
              >
                Learn More
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-8 pt-2 justify-center lg:justify-start"
            >
              {[
                { value: '10K+', label: 'Users' },
                { value: '500K+', label: 'Bookmarks Saved' },
                { value: 'Free', label: 'Forever' },
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="text-xl font-bold text-blue-600">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Dashboard Mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center h-[480px] lg:h-[520px]"
          >
            {/* Main dashboard preview card */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-100 p-5 w-full max-w-sm z-10">
              {/* Header bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 h-6 bg-blue-50 rounded-lg flex items-center px-3">
                  <span className="text-[10px] text-gray-400">Your Bookmarks</span>
                </div>
              </div>

              {/* Mini bookmark rows */}
              {[
                { icon: '🚀', title: 'React Docs', tag: 'Dev' },
                { icon: '🎨', title: 'Dribbble', tag: 'Design' },
                { icon: '📚', title: 'MDN Web Docs', tag: 'Reference' },
                { icon: '⚡', title: 'Vercel Dashboard', tag: 'Tools' },
              ].map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors mb-1.5 cursor-pointer group"
                >
                  <span className="text-lg">{b.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{b.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">https://example.com</p>
                  </div>
                  <span className="tag-pill hidden group-hover:inline-flex">{b.tag}</span>
                </motion.div>
              ))}

              {/* FAB indicator */}
              <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-300">
                <span className="text-white text-xl font-light">+</span>
              </div>
            </div>

            {/* Floating cards */}
            <FloatingCard
              title="ChatGPT Docs"
              url="platform.openai.com"
              tags={['AI', 'Docs']}
              delay={0}
              style={{ position: 'absolute', top: '10%', right: '-4%', zIndex: 20 }}
            />
            <FloatingCard
              title="GitHub Trending"
              url="github.com/trending"
              tags={['Dev', 'OSS']}
              delay={1.5}
              style={{ position: 'absolute', bottom: '10%', left: '-6%', zIndex: 20 }}
            />

            {/* Glow blob behind mockup */}
            <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-blue-400/20 to-cyan-300/10 blur-xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
