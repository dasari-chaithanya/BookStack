import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiBookmark } from 'react-icons/fi'

export default function CTASection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-12 lg:p-16 text-center shadow-2xl shadow-blue-200"
        >
          {/* Background pattern dots */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-cyan-300/20 blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

          {/* Icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/30">
            <FiBookmark className="w-8 h-8 text-white" />
          </div>

          <h2 className="relative text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="relative text-blue-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users who trust BookStack to keep their links organized.
            It's free, private, and takes less than a minute to set up.
          </p>

          <div className="relative flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-600 font-bold text-base hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Register Now
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/40 text-white font-bold text-base hover:bg-white/10 transition-all duration-300"
            >
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
