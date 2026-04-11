import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import Lenis from "lenis"
import { ArrowLeft, Loader2 } from "lucide-react"
import { legalAPI } from "@/lib/api"

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [privacyData, setPrivacyData] = useState({
    title: 'Privacy Policy',
    content: ''
  })

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    const fetchPolicy = async () => {
      try {
        setLoading(true)
        const response = await legalAPI.getPrivacyPolicy()
        if (response.data.success) {
          setPrivacyData(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicy()

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f6e9dc] overflow-x-hidden pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{privacyData.title || 'Privacy Policy'}</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500">Loading policy...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{privacyData.title}</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {privacyData.updatedAt ? new Date(privacyData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <div 
                className="privacy-content"
                dangerouslySetInnerHTML={{ 
                  __html: privacyData.content || '<p className="text-gray-500 italic">Privacy policy content has not been set yet.</p>' 
                }} 
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
