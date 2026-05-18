import { motion } from 'framer-motion'
import { FiPlus } from 'react-icons/fi'

export default function FloatingActionButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-300 flex items-center justify-center hover:shadow-2xl hover:shadow-blue-400 transition-shadow duration-300 animate-pulse-glow"
      aria-label="Add bookmark"
      title="Add bookmark"
    >
      <FiPlus className="w-6 h-6" strokeWidth={2.5} />
    </motion.button>
  )
}
