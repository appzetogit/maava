import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, Clock, Megaphone } from "lucide-react"
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

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationAPI.getRestaurantNotifications()
        setNotifications(response?.data?.data || [])
      } catch (error) {
        console.error('Failed to fetch restaurant notifications:', error)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  const viewData = useMemo(() => notifications.map((item, index) => ({
    id: item._id || index,
    title: item.title,
    message: item.message || item.description,
    time: formatTimeAgo(item.createdAt),
    unread: index === 0,
  })), [notifications])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200">
        <button
          onClick={() => navigate("/restaurant")}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Notifications</h1>
      </div>

      <div className="flex-1 px-4 pt-4 pb-28">
        {loading ? (
          <div className="text-center text-sm text-gray-600 py-12">Loading notifications...</div>
        ) : viewData.length > 0 ? (
          <div className="space-y-3">
            {viewData.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-3 ${item.unread ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600 py-12">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            No notifications
          </div>
        )}
      </div>
    </div>
  )
}
