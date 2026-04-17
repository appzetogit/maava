import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, HelpCircle, Loader2, MessageCircle, Phone, Mail } from "lucide-react"
import { motion } from "framer-motion"
import AnimatedPage from "../../components/AnimatedPage"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/api/config"

export default function Support() {
  const [loading, setLoading] = useState(true)
  const [supportData, setSupportData] = useState({
    title: 'Support & FAQ',
    content: '<p>Loading...</p>'
  })

  useEffect(() => {
    fetchSupportData()
  }, [])

  const fetchSupportData = async () => {
    try {
      setLoading(true)
      const response = await api.get(API_ENDPOINTS.ADMIN.SUPPORT_PUBLIC)
      if (response.data.success) {
        setSupportData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching support data:', error)
      setSupportData({
        title: 'Support & FAQ',
        content: '<p>Unable to load support content at the moment. Please try again later.</p>'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading Support Content...</p>
          </div>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <Link to="/user/profile">
            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Support Page</h1>
        </div>

        {/* Support Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-[#111] rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800"
        >
          <div className="p-6 md:p-8 lg:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <HelpCircle className="h-6 w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
              {supportData.title}
            </h2>
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-p:text-gray-700 dark:prose-p:text-gray-300
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                prose-li:text-gray-700 dark:prose-li:text-gray-300
                prose-a:text-blue-600 dark:prose-a:text-blue-400
                prose-a:no-underline hover:prose-a:underline
                leading-relaxed"
              dangerouslySetInnerHTML={{ __html: supportData.content }}
            />
          </div>
          
          {/* Quick Contact Footer */}
          <div className="bg-gray-50 dark:bg-[#181818] p-6 md:p-8 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Need immediate help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email Us</p>
                  <a href="mailto:mudavathravi1238@gmail.com" className="text-sm font-medium hover:underline">mudavathravi1238@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Call Us</p>
                  <a href="tel:+919010551238" className="text-sm font-medium hover:underline">+91 9010551238</a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mt-8 mb-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Maava Support Team is available 24/7 to assist you.
          </p>
        </motion.div>
      </div>
    </AnimatedPage>
  )
}
