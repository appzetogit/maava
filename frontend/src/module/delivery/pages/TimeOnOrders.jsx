import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronDown, Clock } from "lucide-react"
import { useProgressStore } from "../store/progressStore"
import { getAllDeliveryOrders, DELIVERY_ORDER_STATUS } from "../utils/deliveryOrderStatus"
import { deliveryAPI } from "@/lib/api"

export default function TimeOnOrders() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTimeRange, setSelectedTimeRange] = useState("Select Time")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false)
  const [sessions, setSessions] = useState([])

  const timeRanges = [
    "Select Time",
    "00:00 - 06:00",
    "06:00 - 12:00",
    "12:00 - 18:00",
    "18:00 - 24:00",
    "All Day"
  ]

  const { updateTodayTimeOnOrders } = useProgressStore()

  // Load real sessions from orders
  useEffect(() => {
    const fetchRealSessions = async () => {
      try {
        const todayKey = selectedDate.toISOString().split('T')[0]
        
        // Fetch from backend API to get all orders (even those not in local storage)
        const response = await deliveryAPI.getTripHistory({
          period: 'daily',
          date: todayKey,
          limit: 100
        })

        if (response.data?.success && response.data?.data?.trips) {
          const tripsData = response.data.data.trips
          
          const sessionsData = tripsData.map((trip, index) => {
            const orderId = trip.orderId || trip.id
            
            // Try to get time range from metadata if available
            const startTimeKey = `delivery_order_start_time_${orderId}`
            const endTimeKey = `delivery_order_end_time_${orderId}`
            
            const localStart = localStorage.getItem(startTimeKey)
            const localEnd = localStorage.getItem(endTimeKey)
            
            // Safe split for trip.time
            const timeParts = (typeof trip.time === 'string' && trip.time.includes(' - ')) 
              ? trip.time.split(' - ') 
              : [trip.time || "09:00", "09:15"]

            const startTime = localStart || timeParts[0] || "09:00"
            const endTime = localEnd || timeParts[1] || "09:15"
            
            // Calculate duration safely
            const [sH, sM] = (startTime || "09:00").split(':').map(val => Number(val) || 0)
            const [eH, eM] = (endTime || "00:00").split(':').map(val => Number(val) || 0)
            
            let diffMin = (eH * 60 + sM) - (sH * 60 + sM) // Initial guess
            // If we have actual end time, recalculate
            if (eH || eM) {
              diffMin = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0))
            }
            
            if (diffMin <= 0) diffMin = 15 // Default 15 min session
            if (diffMin > 1440) diffMin = 30 // Max 30 min per delivery (sanity check for bad data)

            const hours = Math.floor(diffMin / 60)
            const minutes = diffMin % 60

            return {
              id: orderId || index,
              session: `Order #${String(orderId).slice(-4)}`,
              timeRange: `${startTime} - ${endTime}`,
              timeOnOrders: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
              duration: diffMin,
              status: trip.status
            }
          })

          // Filter by time range if selected
          let finalSessions = sessionsData
          if (selectedTimeRange !== "Select Time" && selectedTimeRange !== "All Day") {
            const [startRangeH] = selectedTimeRange.split(' - ')[0].split(':').map(Number)
            const startRangeMin = startRangeH * 60
            const endRangeMin = startRangeMin + 360
            
            finalSessions = sessionsData.filter(s => {
              const [sH] = s.timeRange.split(':').map(Number)
              const timeMin = sH * 60
              return timeMin >= startRangeMin && timeMin < endRangeMin
            })
          }

          setSessions(finalSessions)
        } else {
          setSessions([])
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err)
        setSessions([])
      }
    }

    fetchRealSessions()
  }, [selectedDate, selectedTimeRange])

  // Calculate totals
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const finalHours = Math.floor(totalMinutes / 60)
  const finalMinutes = totalMinutes % 60

  // Update store for today
  useEffect(() => {
    const today = new Date().toDateString()
    if (selectedDate.toDateString() === today) {
      updateTodayTimeOnOrders(finalHours + (finalMinutes / 60))
    }
  }, [finalHours, finalMinutes, selectedDate, updateTodayTimeOnOrders])

  const formatDateDisplay = (date) => {
    const today = new Date().toDateString()
    if (date.toDateString() === today) return "Today"
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
  }

  const generateRecentDates = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-lg font-bold text-black flex-1 text-center">Time on orders</h1>
        <div className="w-10"></div>
      </div>

      {/* Selectors */}
      <div className="px-4 py-4 bg-white shadow-sm flex gap-3 z-20">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-100 rounded-xl border border-transparent focus:border-black transition-all"
        >
          <span className="text-sm font-semibold">{formatDateDisplay(selectedDate)}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={() => setShowTimeRangePicker(!showTimeRangePicker)}
          className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-100 rounded-xl border border-transparent focus:border-black transition-all"
        >
          <span className="text-sm font-semibold">{selectedTimeRange}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTimeRangePicker ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Pickers */}
      <div className="relative">
        {showDatePicker && (
          <div className="absolute left-4 right-4 top-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
            {generateRecentDates().map((d, i) => (
              <button
                key={i}
                onClick={() => { setSelectedDate(d); setShowDatePicker(false); }}
                className={`w-full text-left px-5 py-4 border-b last:border-0 hover:bg-gray-50 ${d.toDateString() === selectedDate.toDateString() ? 'bg-black text-white' : 'text-gray-900'}`}
              >
                {formatDateDisplay(d)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative">
            <span className="text-7xl font-black text-black tracking-tighter">
              {String(finalHours).padStart(2, '0')}:{String(finalMinutes).padStart(2, '0')}
            </span>
            <div className="absolute -top-4 -right-8 w-14 h-14 bg-yellow-400 rounded-2xl rotate-12 flex items-center justify-center -z-10 shadow-lg">
              <Clock className="w-8 h-8 text-black -rotate-12" />
            </div>
          </div>
          <p className="text-gray-500 font-medium uppercase tracking-[3px] text-xs mt-4">Total Login Hours</p>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Completed Sessions</h2>
          {sessions.length > 0 ? (
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{s.session}</p>
                      <p className="text-xs text-gray-500 font-medium">{s.timeRange}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-black">{s.timeOnOrders}</p>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Success</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No sessions recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

