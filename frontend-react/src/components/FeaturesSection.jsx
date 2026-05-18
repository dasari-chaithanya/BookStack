import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiLock, FiSliders, FiZap, FiGlobe } from 'react-icons/fi'

const features = [
  {
    icon: FiLock,
    title: 'Private Bookmarks',
    description:
      'Store your favorite links in private, encrypted collections. Your bookmarks are completely confidential — only you can see them. No sharing, no tracking, ever.',
    color: 'from-blue-500 to-indigo-600',
    lightColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    visual: (
      <div className="relative p-6 flex items-center justify-center h-full min-h-[220px]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <FiLock className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col gap-2 w-48">
            {['🔐 Work Links', '🎨 Design Inspo', '📚 Reading List'].map((t) => (
              <div key={t} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-blue-50">
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: FiSliders,
    title: 'Customizable Design',
    description:
      'Make BookStack your own. Tag, categorize, and filter your bookmarks your way. A truly personalized bookmarking experience built around your workflow.',
    color: 'from-violet-500 to-purple-600',
    lightColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
    visual: (
      <div className="relative p-6 flex items-center justify-center h-full min-h-[220px]">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl" />
        <div className="relative grid grid-cols-2 gap-2 w-52">
          {[
            { bg: 'bg-blue-500', label: 'Ocean' },
            { bg: 'bg-violet-500', label: 'Violet' },
            { bg: 'bg-emerald-500', label: 'Forest' },
            { bg: 'bg-rose-500', label: 'Rose' },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3 flex items-center justify-between shadow-md`}>
              <span className="text-white text-xs font-medium">{c.label}</span>
              <div className="w-3 h-3 rounded-full bg-white/40" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: FiZap,
    title: 'Simple and Accessible',
    description:
      'We obsess over usability. A clean, fast interface that gets out of your way. Add, find, and open your bookmarks in seconds — no learning curve required.',
    color: 'from-amber-500 to-orange-600',
    lightColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    visual: (
      <div className="relative p-6 flex items-center justify-center h-full min-h-[220px]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl" />
        <div className="relative flex flex-col gap-3 w-52">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="text-xs">🔍</span>
            </div>
            <span className="text-xs text-gray-500">Search anything...</span>
          </div>
          <div className="flex gap-2">
            <span className="tag-pill bg-amber-100 text-amber-700 border-amber-200 text-xs">⚡ Quick</span>
            <span className="tag-pill bg-orange-100 text-orange-700 border-orange-200 text-xs">✨ Easy</span>
          </div>
          <div className="bg-amber-500 rounded-xl px-4 py-2 text-white text-sm font-medium text-center shadow-md shadow-amber-200">
            Add Bookmark +
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: FiGlobe,
    title: 'Available Everywhere',
    description:
      'Access your bookmarks from any device — desktop, tablet, or mobile. Your links are always with you, synced and ready, wherever you go.',
    color: 'from-emerald-500 to-teal-600',
    lightColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    visual: (
      <div className="relative p-6 flex items-center justify-center h-full min-h-[220px]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl" />
        <div className="relative flex items-end gap-3">
          {/* Desktop */}
          <div className="bg-white rounded-xl p-2 shadow-md border border-emerald-100 w-28 h-20 flex flex-col gap-1.5">
            <div className="h-2 bg-emerald-200 rounded" />
            <div className="h-2 bg-gray-100 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
          {/* Mobile */}
          <div className="bg-white rounded-xl p-2 shadow-md border border-emerald-100 w-12 h-20 flex flex-col gap-1.5">
            <div className="h-2 bg-emerald-200 rounded" />
            <div className="h-2 bg-gray-100 rounded" />
            <div className="h-2 bg-gray-100 rounded" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <FiGlobe className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    ),
  },
]

function FeatureRow({ feature, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const isEven = index % 2 === 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 bg-white rounded-3xl p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow duration-300 border border-blue-50`}
    >
      {/* Visual */}
      <div className="w-full lg:w-5/12 rounded-2xl overflow-hidden flex-shrink-0">
        {feature.visual}
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col gap-4 text-center lg:text-left">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md mx-auto lg:mx-0`}>
          <feature.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
        <p className="text-gray-500 leading-relaxed text-base">{feature.description}</p>
        <div className={`inline-flex items-center gap-1 text-sm font-semibold ${feature.iconColor} cursor-default select-none w-fit mx-auto lg:mx-0`}>
          Learn more →
        </div>
      </div>
    </motion.div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4"
          >
            Why BookStack?
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Everything you need in one place
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto"
          >
            A powerful set of features designed to make bookmark management effortless and enjoyable.
          </motion.p>
        </div>

        {/* Feature rows */}
        <div className="flex flex-col gap-8">
          {features.map((f, i) => (
            <FeatureRow key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
