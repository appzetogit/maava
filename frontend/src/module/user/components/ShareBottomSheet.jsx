import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { MessageCircle, Copy, X } from "lucide-react"

export default function ShareBottomSheet({ isOpen, onClose, shareData, copyToClipboard }) {
  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-[99999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed left-0 right-0 bottom-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-[100000] bg-white dark:bg-[#1a1a1a] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden md:max-w-md w-full"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="px-6 pt-6 pb-2 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Share this</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose how you want to share</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {/* WhatsApp */}
              <button
                onClick={() => {
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text)}`
                  window.open(whatsappUrl, "_blank")
                  onClose()
                }}
                className="w-full flex items-center gap-4 p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 fill-emerald-600 dark:fill-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-base font-bold text-gray-900 dark:text-white">WhatsApp</span>
                  <span className="text-xs text-gray-500">Share with friends and family</span>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => {
                  copyToClipboard(shareData.url)
                  onClose()
                }}
                className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Copy className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-base font-bold text-gray-900 dark:text-white">Copy Link</span>
                  <span className="text-xs text-gray-500">Link copied to your clipboard</span>
                </div>
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-black/20 flex justify-center">
              <button
                onClick={onClose}
                className="text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
