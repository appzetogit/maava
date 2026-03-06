import { useState, useMemo, useEffect } from "react"
import { Search, Download, ChevronDown, Bell, Edit, Trash2, Upload, Settings, Image as ImageIcon, Loader2 } from "lucide-react"
import { adminAPI } from "@/lib/api"
import { toast } from "sonner"

export default function PushNotification() {
  const [formData, setFormData] = useState({
    title: "",
    zone: "All",
    sendTo: "Customer",
    description: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getNotifications()
      if (response.data?.success) {
        setNotifications(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) {
      return notifications
    }

    const query = searchQuery.toLowerCase().trim()
    return notifications.filter(notification =>
      notification.title?.toLowerCase().includes(query) ||
      notification.description?.toLowerCase().includes(query)
    )
  }, [notifications, searchQuery])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      toast.error("Please fill title and description")
      return
    }

    try {
      setSending(true)
      const response = await adminAPI.sendPushNotification(formData)
      if (response.data?.success) {
        toast.success("Notification sent successfully!")
        handleReset()
        fetchNotifications() // Refresh list
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      toast.error(error.response?.data?.message || "Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => {
    setFormData({
      title: "",
      zone: "All",
      sendTo: "Customer",
      description: "",
    })
  }

  const handleToggleStatus = async (id) => {
    try {
      const response = await adminAPI.toggleNotificationStatus(id)
      if (response.data?.success) {
        setNotifications(notifications.map(notification =>
          notification._id === id ? { ...notification, status: !notification.status } : notification
        ))
        toast.success(response.data.message)
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        const response = await adminAPI.deleteNotification(id)
        if (response.data?.success) {
          setNotifications(notifications.filter(notification => notification._id !== id))
          toast.success("Notification deleted successfully")
        }
      } catch (error) {
        console.error("Error deleting notification:", error)
        toast.error("Failed to delete notification")
      }
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Create New Notification Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Push Notification</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ex: Notification Title"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Zone
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => handleInputChange("zone", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="All">All</option>
                  <option value="Asia">Asia</option>
                  <option value="Europe">Europe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Send To
                </label>
                <select
                  value={formData.sendTo}
                  onChange={(e) => handleInputChange("sendTo", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Customer">Customer</option>
                  <option value="Delivery Man">Delivery Man</option>
                  <option value="Restaurant">Restaurant</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Ex: Notification Descriptions"
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md disabled:bg-blue-400"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {sending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </form>
        </div>

        {/* Notification List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Notification History</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredNotifications.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              <button className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-all">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Loading history...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">SI</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        No notifications found
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <tr
                        key={notification._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{notification.sl}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">{notification.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700 line-clamp-2">{notification.description}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-700">{notification.zone}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-700">{notification.target}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(notification._id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notification.status ? "bg-blue-600" : "bg-slate-300"
                              }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notification.status ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDelete(notification._id)}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
