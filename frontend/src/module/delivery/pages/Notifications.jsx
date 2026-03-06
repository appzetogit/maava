import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Package
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { notificationAPI } from "@/lib/api"

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "Just now"

  const date = new Date(dateValue)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day ago`
  return date.toLocaleDateString()
}

const getIconMeta = (title = '', message = '') => {
  const text = `${title} ${message}`.toLowerCase()

  if (text.includes('order') || text.includes('delivery')) {
    return { icon: Package, color: "bg-[#ff8100]" }
  }

  if (text.includes('success') || text.includes('credited') || text.includes('received')) {
    return { icon: CheckCircle, color: "bg-green-500" }
  }

  if (text.includes('alert') || text.includes('failed') || text.includes('cancel')) {
    return { icon: AlertCircle, color: "bg-yellow-500" }
  }

  return { icon: Info, color: "bg-blue-500" }
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationAPI.getDeliveryNotifications()
        setNotifications(response?.data?.data || [])
      } catch (error) {
        console.error('Failed to fetch delivery notifications:', error)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  const viewData = useMemo(() => notifications.map((item, idx) => ({
    id: item._id || idx,
    title: item.title,
    message: item.message || item.description,
    time: formatTimeAgo(item.createdAt),
    read: idx !== 0,
    ...getIconMeta(item.title, item.message || item.description),
  })), [notifications])

  const unreadCount = viewData.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-[#f6e9dc] overflow-x-hidden pb-24 md:pb-6">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:py-3 flex items-center justify-between rounded-b-3xl md:rounded-b-none sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate("/delivery")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <span className="bg-[#ff8100] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {unreadCount} New
          </span>
        )}
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading notifications...</div>
        ) : viewData.length > 0 ? (
          <div className="space-y-3">
            {viewData.map((notification) => {
              const Icon = notification.icon
              return (
                <Card
                  key={notification.id}
                  className={`bg-white shadow-sm border py-0 border-gray-100 transition-all ${!notification.read ? 'border-l-4 border-l-[#ff8100]' : ''
                    }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`${notification.color} p-2 rounded-full flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-sm md:text-base ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#ff8100] rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm md:text-base mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-base md:text-lg">No notifications</p>
          </div>
        )}
      </div>
    </div>
  )
}
