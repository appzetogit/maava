import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, HelpCircle, Menu, Search, SlidersHorizontal, Calendar, Reply, ChevronLeft, Send, X, Loader2, ChevronRight } from "lucide-react"
import { DateRangeCalendar } from "@/components/ui/date-range-calendar"
import BottomNavOrders from "../components/BottomNavOrders"
import { restaurantAPI } from "@/lib/api"

const REVIEWS_STORAGE_KEY = "restaurant_reviews_data"

const tabs = [
  { id: "complaints", label: "Complaints" },
  { id: "reviews", label: "Reviews" },
]

// Dummy review data
const dummyReviews = [
  {
    id: 1,
    orderNumber: "0",
    outlet: "Kadhai Chammach Restaur.. By Pass Road (South)",
    userName: "Pradeep Rajput",
    userImage: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=80",
    ordersCount: 0,
    rating: 5,
    date: "30 Dec, 2023 2:05 PM",
    reviewText: "very good nice food"
  },
  {
    id: 2,
    orderNumber: "1234",
    outlet: "Kadhai Chammach Restaur.. By Pass Road (North)",
    userName: "Rahul Sharma",
    userImage: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=80",
    ordersCount: 3,
    rating: 4,
    date: "29 Dec, 2023 8:30 AM",
    reviewText: "Great food quality and fast delivery. Will order again!"
  },
  {
    id: 3,
    orderNumber: "1235",
    outlet: "Kadhai Chammach Restaur.. By Pass Road (South)",
    userName: "Priya Patel",
    userImage: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=80",
    ordersCount: 1,
    rating: 5,
    date: "28 Dec, 2023 6:15 PM",
    reviewText: "Amazing taste! The biryani was perfect."
  },
  {
    id: 4,
    orderNumber: "1236",
    outlet: "Kadhai Chammach Restaur.. By Pass Road (Central)",
    userName: "Amit Kumar",
    userImage: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=80",
    ordersCount: 5,
    rating: 3,
    date: "27 Dec, 2023 1:20 PM",
    reviewText: "Food was okay, but delivery took longer than expected."
  },
  {
    id: 5,
    orderNumber: "1237",
    outlet: "Kadhai Chammach Restaur.. By Pass Road (South)",
    userName: "Sneha Reddy",
    userImage: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80",
    ordersCount: 2,
    rating: 5,
    date: "26 Dec, 2023 9:45 AM",
    reviewText: "Excellent service and delicious food. Highly recommended!"
  },
  {
    id: 6,
    orderNumber: "1238",
    outlet: "Kadhai Chammach Restaur.. By Pass Road (North)",
    userName: "Vikram Singh",
    userImage: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=80",
    ordersCount: 7,
    rating: 4,
    date: "25 Dec, 2023 4:10 PM",
    reviewText: "Good quality food. Packaging was neat and clean."
  }
]

export default function Feedback() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabFromUrl === "complaints" ? "complaints" : "reviews")
  const navigate = useNavigate()
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabFromUrl === "complaints") {
      setActiveTab("complaints")
    } else {
      // Default to reviews if no tab param or if param is "reviews"
      setActiveTab("reviews")
    }
  }, [tabFromUrl])

  // Swipe gesture refs
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  const feedbackTabs = ["complaints", "reviews"]
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("duration")
  const [filterValues, setFilterValues] = useState({
    duration: null,
    sortBy: null,
    reviewType: []
  })
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [displayedReviews, setDisplayedReviews] = useState([])

  // Complaints filter state
  const [isComplaintsFilterOpen, setIsComplaintsFilterOpen] = useState(false)
  const [selectedComplaintsFilterCategory, setSelectedComplaintsFilterCategory] = useState("issueType")
  const [complaintsFilterValues, setComplaintsFilterValues] = useState({
    issueType: [],
    reasons: []
  })
  const [complaintsSearchQuery, setComplaintsSearchQuery] = useState("")

  // Date selector state
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState("last5days") // "today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth", "last5days", "custom"
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null })
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
  const [isComplaintsLoading, setIsComplaintsLoading] = useState(false)
  const [complaints, setComplaints] = useState([])

  // Restaurant data state
  const [restaurantData, setRestaurantData] = useState(null)
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [ratingSummary, setRatingSummary] = useState({
    averageRating: 0,
    totalRatings: 0,
    totalReviews: 0
  })

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setIsLoadingRestaurant(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        if (response.data?.success && response.data.data?.restaurant) {
          setRestaurantData(response.data.data.restaurant)
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error)
      } finally {
        setIsLoadingRestaurant(false)
      }
    }
    fetchRestaurantData()
  }, [])

  // Fetch complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      if (activeTab !== 'complaints') return

      try {
        setIsComplaintsLoading(true)
        const dateRanges = getDateRanges()
        let fromDate = null
        let toDate = null

        switch (selectedDateRange) {
          case 'today':
            fromDate = dateRanges.today
            toDate = new Date()
            break
          case 'yesterday':
            fromDate = dateRanges.yesterday
            toDate = new Date(dateRanges.yesterday)
            toDate.setHours(23, 59, 59, 999)
            break
          case 'thisWeek':
            fromDate = dateRanges.thisWeekStart
            toDate = dateRanges.thisWeekEnd
            break
          case 'lastWeek':
            fromDate = dateRanges.lastWeekStart
            toDate = dateRanges.lastWeekEnd
            break
          case 'thisMonth':
            fromDate = dateRanges.thisMonthStart
            toDate = dateRanges.thisMonthEnd
            break
          case 'lastMonth':
            fromDate = dateRanges.lastMonthStart
            toDate = dateRanges.lastMonthEnd
            break
          case 'last5days':
            fromDate = dateRanges.last5DaysStart
            toDate = dateRanges.last5DaysEnd
            break
          case 'custom':
            if (customDateRange.start && customDateRange.end) {
              fromDate = customDateRange.start
              toDate = customDateRange.end
            }
            break
        }

        const params = {}
        if (fromDate) params.fromDate = fromDate.toISOString()
        if (toDate) params.toDate = toDate.toISOString()
        if (complaintsFilterValues.issueType?.length > 0) {
          params.complaintType = complaintsFilterValues.issueType[0]
        }
        if (complaintsSearchQuery) params.search = complaintsSearchQuery

        const response = await restaurantAPI.getComplaints(params)
        if (response?.data?.success && response.data.data?.complaints) {
          setComplaints(response.data.data.complaints)
        } else {
          setComplaints([])
        }
      } catch (error) {
        console.error('Error fetching complaints:', error)
        setComplaints([])
      } finally {
        setIsComplaintsLoading(false)
      }
    }

    fetchComplaints()
  }, [activeTab, selectedDateRange, customDateRange, complaintsFilterValues, complaintsSearchQuery])

  // Fetch reviews from orders
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true)
        // Fetch all delivered orders
        let allOrders = []
        let page = 1
        let hasMore = true
        const limit = 1000
        const maxPages = 50

        while (hasMore && page <= maxPages) {
          try {
            const response = await restaurantAPI.getOrders({
              page,
              limit,
              status: 'delivered'
            })

            if (response.data?.success && response.data.data?.orders) {
              const orders = response.data.data.orders
              allOrders = [...allOrders, ...orders]

              const totalPages = response.data.data.pagination?.totalPages || response.data.data.totalPages || 1
              if (orders.length < limit || (totalPages > 0 && page >= totalPages)) {
                hasMore = false
              } else {
                page++
              }
            } else {
              hasMore = false
            }
          } catch (pageError) {
            console.error(`Error fetching orders page ${page}:`, pageError)
            hasMore = false
          }
        }

        // Transform orders to reviews format
        // Note: If orders have review/rating fields, use them. Otherwise, we'll show delivered orders as reviews
        const transformedReviews = allOrders
          .filter(order => order.status === 'delivered')
          .map((order, index) => {
            const orderDate = new Date(order.createdAt || order.deliveredAt || Date.now())
            // Format date as "30 Dec, 2023 2:05 PM"
            const day = orderDate.getDate()
            const month = orderDate.toLocaleDateString('en-GB', { month: 'short' })
            const year = orderDate.getFullYear()
            const hours = orderDate.getHours()
            const minutes = orderDate.getMinutes()
            const ampm = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12
            const displayMinutes = minutes.toString().padStart(2, '0')
            const formattedDate = `${day} ${month}, ${year} ${displayHours}:${displayMinutes} ${ampm}`

            // Extract user info
            const userName = order.userId?.name ||
              (typeof order.userId === 'object' && order.userId?.name) ||
              'Customer'
            const userImage = order.userId?.profileImage ||
              (typeof order.userId === 'object' && order.userId?.profileImage) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`

            // Get outlet/restaurant name
            const outlet = order.restaurantName ||
              (restaurantData?.name) ||
              'Restaurant'

            // Get rating if available (from order.review or order.rating)
            const rating = order.review?.rating ||
              order.rating ||
              order.feedback?.rating ||
              null
            const reviewText = order.review?.comment ||
              order.review?.text ||
              order.feedback?.comment ||
              order.feedback?.text ||
              (rating ? `${rating}★ rating` : 'No review text')

            // Count user's orders with this restaurant
            const userOrdersCount = allOrders.filter(o =>
              (o.userId?._id || o.userId) === (order.userId?._id || order.userId)
            ).length

            return {
              id: order._id || order.orderId || `review-${index}`,
              orderNumber: order.orderId || order.orderNumber || String(index),
              outlet: outlet,
              userName: userName,
              userImage: userImage,
              ordersCount: userOrdersCount,
              rating: rating || 5, // Default to 5 if no rating
              date: formattedDate,
              reviewText: reviewText,
              reply: order.review?.reply || order.feedback?.reply || null,
              orderData: order // Keep original order data
            }
          })
          .filter(review => {
            // Include reviews that have a rating or have review text (not the default "No review text")
            return review.rating !== null || (review.reviewText && review.reviewText !== 'No review text')
          })

        // Calculate rating summary
        const ratings = transformedReviews.map(r => r.rating).filter(r => r !== null)
        const averageRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : 0
        const totalRatings = ratings.length
        const totalReviews = transformedReviews.length

        setRatingSummary({
          averageRating: parseFloat(averageRating),
          totalRatings,
          totalReviews
        })

        setReviews(transformedReviews)

        // Save to localStorage for offline access
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(transformedReviews))
          }
        } catch (error) {
          console.error("Error saving reviews to storage:", error)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        // Keep existing reviews on error
      } finally {
        setIsLoadingReviews(false)
      }
    }

    if (!isLoadingRestaurant) {
      fetchReviews()
    }
  }, [isLoadingRestaurant, restaurantData])

  // Persist reviews to localStorage whenever they change (removed - now done in fetchReviews)

  // Update displayed reviews when reviews or filter values change
  useEffect(() => {
    let filtered = [...reviews]

    // Filter by duration (if selected)
    if (filterValues.duration) {
      const now = new Date()
      const daysAgo = filterValues.duration === "7days" ? 7 : filterValues.duration === "30days" ? 30 : 90
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(review => {
        // Parse date from review.date string (format: "30 Dec, 2023 2:05 PM")
        const reviewDate = new Date(review.date)
        return reviewDate >= cutoffDate
      })
    }

    // Filter by review type (if selected)
    if (filterValues.reviewType && filterValues.reviewType.length > 0) {
      // For now, we'll keep all reviews as we don't have review type in the data
      // This can be extended when review type is added to the review data structure
    }

    // Sort reviews
    if (filterValues.sortBy) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)

        switch (filterValues.sortBy) {
          case "newest":
            return dateB - dateA
          case "oldest":
            return dateA - dateB
          case "bestRated":
            return b.rating - a.rating
          case "worstRated":
            return a.rating - b.rating
          default:
            return 0
        }
      })
    }

    setDisplayedReviews(filtered)
  }, [reviews, filterValues])

  // Handle review card click
  const handleReviewClick = (review) => {
    setSelectedReview(review)
    setReplyText(review.reply || "")
    setIsReviewModalOpen(true)
  }

  // Handle reply send
  const handleSendReply = async () => {
    if (!selectedReview || !replyText.trim()) return

    try {
      // TODO: Implement API call to save reply to backend
      // For now, update local state
      setReviews(prev =>
        prev.map(review =>
          review.id === selectedReview.id
            ? { ...review, reply: replyText.trim() }
            : review
        )
      )

      setSelectedReview(prev => prev ? { ...prev, reply: replyText.trim() } : null)
      setReplyText("")
      setIsReviewModalOpen(false)

      // Save to localStorage
      try {
        if (typeof window !== "undefined") {
          const updatedReviews = reviews.map(review =>
            review.id === selectedReview.id
              ? { ...review, reply: replyText.trim() }
              : review
          )
          localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updatedReviews))
        }
      } catch (error) {
        console.error("Error saving reply to storage:", error)
      }
    } catch (error) {
      console.error("Error sending reply:", error)
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setIsReviewModalOpen(false)
    setSelectedReview(null)
    setReplyText("")
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterValues({
      duration: null,
      sortBy: null,
      reviewType: []
    })
    setIsFilterLoading(true)
    setTimeout(() => {
      setIsFilterLoading(false)
    }, 200)
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setIsFilterLoading(true)
    setIsFilterOpen(false)

    // Show loading animation for 200ms
    setTimeout(() => {
      setIsFilterLoading(false)
    }, 200)
  }

  // Date helper functions
  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const day = days[date.getDay()]
    const dayNum = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day}, ${dayNum} ${month} ${year}`
  }

  const formatDateShort = (date) => {
    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'short' })
    return `${day} ${month}`
  }

  const getDateRanges = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // This week so far (Monday to today)
    const thisWeekStart = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday is 0
    thisWeekStart.setDate(today.getDate() - diff)

    // Last week (Monday to Sunday)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

    // This month so far
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    // Last 5 days
    const last5DaysStart = new Date(today)
    last5DaysStart.setDate(last5DaysStart.getDate() - 4) // Including today

    return {
      today,
      yesterday,
      thisWeekStart,
      thisWeekEnd: today,
      lastWeekStart,
      lastWeekEnd,
      thisMonthStart,
      thisMonthEnd: today,
      lastMonthStart,
      lastMonthEnd,
      last5DaysStart,
      last5DaysEnd: today
    }
  }

  // Handle complaints filter apply
  const handleComplaintsFilterApply = () => {
    setIsComplaintsLoading(true)
    setIsComplaintsFilterOpen(false)

    setTimeout(() => {
      setIsComplaintsLoading(false)
    }, 200)
  }

  // Handle complaints filter reset
  const handleComplaintsFilterReset = () => {
    setComplaintsFilterValues({
      issueType: [],
      reasons: []
    })
    setComplaintsSearchQuery("")
    setIsComplaintsLoading(true)
    setTimeout(() => {
      setIsComplaintsLoading(false)
    }, 200)
  }

  // Handle date range selection
  const handleDateRangeSelect = (range) => {
    setSelectedDateRange(range)
    if (range === "custom") {
      setIsCustomDateOpen(true)
    } else {
      setIsDateSelectorOpen(false)
      setIsComplaintsLoading(true)
      setTimeout(() => {
        setIsComplaintsLoading(false)
      }, 200)
    }
  }

  // Handle custom date range apply
  const handleCustomDateApply = () => {
    setIsCustomDateOpen(false)
    setIsDateSelectorOpen(false)
    setIsComplaintsLoading(true)
    setTimeout(() => {
      setIsComplaintsLoading(false)
    }, 200)
  }

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = e.touches[0].clientX
    isSwiping.current = false
  }

  const handleTouchMove = (e) => {
    if (!isSwiping.current) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

      // Determine if this is a horizontal swipe
      if (deltaX > deltaY && deltaX > 10) {
        isSwiping.current = true
      }
    }

    if (isSwiping.current) {
      touchEndX.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = () => {
    if (!isSwiping.current) {
      touchStartX.current = 0
      touchEndX.current = 0
      return
    }

    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50
    const swipeVelocity = Math.abs(swipeDistance)

    if (swipeVelocity > minSwipeDistance && !isTransitioning) {
      const currentIndex = feedbackTabs.findIndex(tab => tab === activeTab)
      let newIndex = currentIndex

      if (swipeDistance > 0 && currentIndex < feedbackTabs.length - 1) {
        // Swipe left - go to next tab
        newIndex = currentIndex + 1
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        newIndex = currentIndex - 1
      }

      if (newIndex !== currentIndex) {
        setIsTransitioning(true)

        // Smooth transition with animation
        setTimeout(() => {
          setActiveTab(feedbackTabs[newIndex])

          // Reset transition state after animation
          setTimeout(() => {
            setIsTransitioning(false)
          }, 300)
        }, 50)
      }
    }

    // Reset touch positions
    touchStartX.current = 0
    touchEndX.current = 0
    touchStartY.current = 0
    isSwiping.current = false
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="">
        {/* Top row - restaurant label + icons */}
        <div className="sticky bg-white top-0 z-40 px-4 py-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] tracking-[0.15em] text-gray-400 font-bold uppercase">
              Showing data for
            </p>
            <p className="text-base font-extrabold text-black mt-0.5">
              {isLoadingRestaurant ? "Loading..." : (restaurantData?.name || "Restaurant")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
              onClick={() => navigate("/restaurant/notifications")}
            >
              <Bell className="w-5 h-5 text-black" />
            </button>
            <button
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
              onClick={() => navigate("/restaurant/help-centre")}
            >
              <HelpCircle className="w-5 h-5 text-black" />
            </button>
            <button
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
              onClick={() => navigate("/restaurant/explore")}
            >
              <Menu className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex gap-2 px-4 pt-4 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3.5 rounded-full text-sm font-bold whitespace-nowrap relative overflow-hidden ${isActive ? "text-white" : "bg-white text-gray-600 border border-gray-100 shadow-sm"
                  }`}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                whileTap={{ scale: 0.97 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="feedbackTabActive"
                    className="absolute inset-0 bg-black rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Date range row only for Complaints tab */}
        {activeTab === "complaints" && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <button
              className="flex-1 bg-white flex items-center justify-between rounded-xl px-4 py-3 border border-gray-100 hover:bg-gray-50 transition-all shadow-sm"
              onClick={() => setIsDateSelectorOpen(true)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-black">
                  {selectedDateRange === "last5days" ? "Last 5 days" :
                    selectedDateRange === "today" ? "Today so far" :
                      selectedDateRange === "yesterday" ? "Yesterday" :
                        selectedDateRange === "thisWeek" ? "This week so far" :
                          selectedDateRange === "lastWeek" ? "Last week" :
                            selectedDateRange === "thisMonth" ? "This month so far" :
                              selectedDateRange === "lastMonth" ? "Last month" :
                                selectedDateRange === "custom" && customDateRange.start && customDateRange.end ?
                                  `${formatDateShort(customDateRange.start)} - ${formatDateShort(customDateRange.end)}` :
                                  "Last 5 days"}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  Select your own date range
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black" />
              </div>
            </button>
            <button
              className="w-14 self-stretch rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              onClick={() => setIsComplaintsFilterOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5 text-black" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="flex-1 px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "complaints" ? (
              <div className="relative">
                {isComplaintsLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg"
                  >
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </motion.div>
                )}
                {complaints.length === 0 ? (
                  <div className="text-center text-sm text-gray-600 mt-12">
                    No complaints for the selected period.
                  </div>
                ) : (
                  <div className="space-y-4 pb-6">
                    {complaints.map((complaint) => (
                      <div key={complaint._id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-extrabold text-black">{complaint.customerName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order #{complaint.orderNumber}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-black mb-1">{complaint.subject}</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">{complaint.description}</p>
                        {complaint.restaurantResponse && (
                          <div className="bg-gray-50 rounded-2xl p-4 mt-3 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your Response</p>
                            <p className="text-sm text-black font-medium">{complaint.restaurantResponse}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-4">
                          <Calendar className="w-3 h-3 text-gray-300" />
                          <p className="text-[10px] text-gray-400 font-bold">
                            {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 pb-6">
                {/* Search + filter */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shrink-0 shadow-sm flex items-center gap-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reviews"
                      className="flex-1 text-sm text-gray-900 placeholder-gray-300 bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    className="w-14 self-stretch rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <SlidersHorizontal className="w-5 h-5 text-black" />
                  </button>
                </div>

                {/* Reviews heading + info */}
                <div className="flex items-end justify-between px-1 mt-6 mb-2">
                  <h2 className="text-base font-extrabold text-black">
                    Reviews ({displayedReviews.length})
                  </h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-gray-50 flex items-center justify-center text-[8px] border border-gray-100">ⓘ</span>
                    <span>Delivery reviews private to you</span>
                  </div>
                </div>

                {/* Review cards */}
                <div className="space-y-2 relative">
                  {(isFilterLoading || isLoadingReviews) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg"
                    >
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </motion.div>
                  )}
                  {isLoadingReviews && displayedReviews.length === 0 ? (
                    <div className="text-center text-sm text-gray-600 py-8">
                      Loading reviews...
                    </div>
                  ) : displayedReviews.length === 0 ? (
                    <div className="text-center text-sm text-gray-600 py-8">
                      No reviews found.
                    </div>
                  ) : (
                    displayedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-3xl bg-white p-5 space-y-4 shadow-sm border border-gray-100 cursor-pointer"
                        onClick={() => handleReviewClick(review)}
                      >
                        {/* Order & outlet */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                            ORDER #{review.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 truncate max-w-[150px]">
                            {review.outlet}
                          </span>
                        </div>

                        {/* User row */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={review.userImage}
                              alt={review.userName}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-50 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-black">
                              {review.userName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              {review.ordersCount} ORDER{review.ordersCount !== 1 ? 'S' : ''} WITH YOU
                            </p>
                          </div>
                        </div>

                        {/* Rating + text card */}
                        <div className="mt-2 rounded-2xl bg-gray-50/50 p-4 relative border border-gray-100/50">
                          {/* Speech bubble tail */}
                          <div className="absolute -top-2 left-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-50/50"></div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[10px] font-extrabold shadow-sm">
                              {review.rating} ★
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {review.date}
                            </span>
                          </div>
                          <p className="text-sm text-black font-medium leading-relaxed">
                            {review.reviewText}
                          </p>
                        </div>

                        {/* Reply section - show if reply exists */}
                        {review.reply && (
                          <div className="mt-2 rounded-2xl bg-white px-4 py-3 relative border border-gray-100">
                            {/* Speech bubble tail for reply */}
                            <div className="absolute -top-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white"></div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Your reply
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 font-medium">
                              {review.reply}
                            </p>
                          </div>
                        )}

                        {/* Reply link */}
                        <div className="flex justify-end pt-1">
                          <button
                            className="text-xs font-bold text-black border border-gray-100 flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl transition-all hover:bg-gray-50 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReviewClick(review)
                            }}
                          >
                            <Reply className="w-3.5 h-3.5 text-purple-600" />
                            <span>{review.reply ? "Edit Reply" : "Reply"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedReview && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9999]"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[9999] max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center gap-3 z-10 px-4 py-4">
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>
                <h2 className="text-lg font-extrabold text-black">Review Details</h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* Restaurant name */}
                <p className="text-sm text-gray-600 mb-4">
                  {selectedReview.outlet}
                </p>

                {/* User row */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={selectedReview.userImage}
                    alt={selectedReview.userName}
                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-50 shadow-sm"
                  />
                  <div>
                    <p className="text-base font-extrabold text-black">
                      {selectedReview.userName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {selectedReview.ordersCount} ORDER{selectedReview.ordersCount !== 1 ? 'S' : ''} WITH YOU
                    </p>
                  </div>
                </div>

                {/* Rating + text card */}
                <div className="mt-1 rounded-2xl bg-gray-50 px-4 py-3 relative mb-6 border border-gray-100">
                  {/* Speech bubble tail */}
                  <div className="absolute -top-2 left-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-50"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[10px] font-extrabold shadow-sm">
                      {selectedReview.rating} ★
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {selectedReview.date}
                    </span>
                  </div>
                  <p className="text-sm text-black font-medium leading-relaxed">
                    {selectedReview.reviewText}
                  </p>
                </div>
              </div>

              {/* Reply Input Area */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply"
                    className="flex-1 px-5 py-3 rounded-xl border border-gray-100 text-sm text-gray-900 placeholder-gray-300 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-black/5"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && replyText.trim()) {
                        handleSendReply()
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${replyText.trim()
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
                      }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9999]"
              onClick={() => setIsFilterOpen(false)}
            />

            {/* Filter Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[9999] h-[65vh] flex flex-col"

              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <h2 className="text-lg font-extrabold text-black">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-black/90 transition-colors shadow-md"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content - Two Column Layout */}
              <div className="flex-1 overflow-hidden flex">
                {/* Left Column - Filter Categories */}
                <div className="w-32 bg-gray-50 border-r border-gray-100 flex flex-col">
                  {[
                    { id: "duration", label: "Duration" },
                    { id: "sortBy", label: "Sort by" },
                    { id: "reviewType", label: "Review type" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedFilterCategory(cat.id)}
                      className={`p-5 text-left text-xs font-bold uppercase tracking-widest transition-all ${selectedFilterCategory === cat.id
                        ? "bg-white text-black border-l-4 border-black"
                        : "text-gray-400 hover:bg-white"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Right Column - Filter Options */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {selectedFilterCategory === "duration" && (
                    <div className="space-y-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="duration"
                          checked={filterValues.duration === "7days"}
                          onChange={() => setFilterValues(prev => ({ ...prev, duration: "7days" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Last 7 days</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="duration"
                          checked={filterValues.duration === "30days"}
                          onChange={() => setFilterValues(prev => ({ ...prev, duration: "30days" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Last 30 days</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="duration"
                          checked={filterValues.duration === "90days"}
                          onChange={() => setFilterValues(prev => ({ ...prev, duration: "90days" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Last 90 days</span>
                      </label>
                    </div>
                  )}

                  {selectedFilterCategory === "sortBy" && (
                    <div className="space-y-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          checked={filterValues.sortBy === "newest"}
                          onChange={() => setFilterValues(prev => ({ ...prev, sortBy: "newest" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Newest first</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          checked={filterValues.sortBy === "oldest"}
                          onChange={() => setFilterValues(prev => ({ ...prev, sortBy: "oldest" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Oldest first</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          checked={filterValues.sortBy === "bestRated"}
                          onChange={() => setFilterValues(prev => ({ ...prev, sortBy: "bestRated" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Best rated first</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          checked={filterValues.sortBy === "worstRated"}
                          onChange={() => setFilterValues(prev => ({ ...prev, sortBy: "worstRated" }))}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="text-sm text-gray-900 font-medium">Worst rated first</span>
                      </label>
                    </div>
                  )}

                  {selectedFilterCategory === "reviewType" && (
                    <div className="space-y-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterValues.reviewType.includes("detailed")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues(prev => ({
                                ...prev,
                                reviewType: [...prev.reviewType, "detailed"]
                              }))
                            } else {
                              setFilterValues(prev => ({
                                ...prev,
                                reviewType: prev.reviewType.filter(t => t !== "detailed")
                              }))
                            }
                          }}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black rounded"
                        />
                        <span className="text-sm text-gray-900 font-medium">Detailed reviews</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterValues.reviewType.includes("dining")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues(prev => ({
                                ...prev,
                                reviewType: [...prev.reviewType, "dining"]
                              }))
                            } else {
                              setFilterValues(prev => ({
                                ...prev,
                                reviewType: prev.reviewType.filter(t => t !== "dining")
                              }))
                            }
                          }}
                          className="w-5 h-5 text-black border-gray-300 focus:ring-black rounded"
                        />
                        <span className="text-sm text-gray-900 font-medium">Dining</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterValues.reviewType.includes("delivery")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues(prev => ({
                                ...prev,
                                reviewType: [...prev.reviewType, "delivery"]
                              }))
                            } else {
                              setFilterValues(prev => ({
                                ...prev,
                                reviewType: prev.reviewType.filter(t => t !== "delivery")
                              }))
                            }
                          }}
                          className="w-5 h-5 text-black border-gray-100 focus:ring-black rounded"
                        />
                        <span className="text-sm text-gray-900 font-medium">Delivery</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer - Action Buttons */}
              <div className="border-t border-gray-100 px-6 py-6 flex gap-4">
                <button
                  onClick={handleFilterReset}
                  className="flex-1 py-4 text-sm font-extrabold text-black hover:bg-gray-50 rounded-2xl transition-all border border-gray-100"
                >
                  Reset
                </button>
                <button
                  onClick={handleFilterApply}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-extrabold shadow-md hover:bg-black/90 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Date Selector Popup */}
      <AnimatePresence>
        {isDateSelectorOpen && !isCustomDateOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9999]"
              onClick={() => setIsDateSelectorOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[9999] max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-5 border-b border-gray-100">
                <h2 className="text-lg font-extrabold text-black text-center">Date Range Selection</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {(() => {
                  const ranges = getDateRanges()
                  const dateOptions = [
                    { id: "today", label: "Today so far", date: formatDate(ranges.today) },
                    { id: "yesterday", label: "Yesterday", date: formatDate(ranges.yesterday) },
                    { id: "thisWeek", label: "This week so far", date: `${formatDateShort(ranges.thisWeekStart)} - ${formatDateShort(ranges.thisWeekEnd)}` },
                    { id: "lastWeek", label: "Last week", date: `${formatDateShort(ranges.lastWeekStart)} - ${formatDateShort(ranges.lastWeekEnd)}` },
                    { id: "thisMonth", label: "This month so far", date: `${formatDateShort(ranges.thisMonthStart)} - ${formatDateShort(ranges.thisMonthEnd)}` },
                    { id: "lastMonth", label: "Last month", date: `${formatDateShort(ranges.lastMonthStart)} - ${formatDateShort(ranges.lastMonthEnd)}` },
                    { id: "last5days", label: "Last 5 days", date: `${formatDateShort(ranges.last5DaysStart)} - ${formatDateShort(ranges.last5DaysEnd)}` }
                  ]
                  return (
                    <div className="space-y-4">
                      {dateOptions.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center justify-between cursor-pointer py-2"
                          onClick={() => handleDateRangeSelect(option.id)}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-black">{option.label}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{option.date}</span>
                          </div>
                          <input
                            type="radio"
                            name="dateRange"
                            checked={selectedDateRange === option.id}
                            onChange={() => handleDateRangeSelect(option.id)}
                            className="w-5 h-5 text-black border-gray-100 focus:ring-black"
                          />
                        </label>
                      ))}
                      <button
                        onClick={() => handleDateRangeSelect("custom")}
                        className="w-full flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="flex flex-col text-start">
                          <span className="text-sm font-extrabold text-start text-black">Custom Date</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Select your own range</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>
                  )
                })()}
              </div>
              <div className="border-t border-gray-100 px-6 py-6 flex gap-4">
                <button
                  onClick={() => setIsDateSelectorOpen(false)}
                  className="flex-1 py-4 text-sm font-extrabold text-black hover:bg-gray-50 rounded-2xl transition-all border border-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsDateSelectorOpen(false)
                    setIsComplaintsLoading(true)
                    setTimeout(() => {
                      setIsComplaintsLoading(false)
                    }, 200)
                  }}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-extrabold shadow-md hover:bg-black/90 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Date Calendar Popup */}
      <AnimatePresence>
        {isCustomDateOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[10000]"
              onClick={() => {
                setIsCustomDateOpen(false)
                setIsDateSelectorOpen(true)
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[10000] max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCustomDateOpen(false)
                    setIsDateSelectorOpen(true)
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>
                <h2 className="text-lg font-extrabold text-black">Custom Date</h2>
                <div className="w-8" />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <DateRangeCalendar
                  startDate={customDateRange.start}
                  endDate={customDateRange.end}
                  onDateRangeChange={(start, end) => {
                    setCustomDateRange({ start, end })
                    setSelectedDateRange("custom")
                  }}
                  onClose={() => {
                    setIsCustomDateOpen(false)
                    setIsDateSelectorOpen(true)
                  }}
                />
              </div>
              <div className="border-t border-gray-100 px-6 py-6 flex gap-4">
                <button
                  onClick={() => {
                    setIsCustomDateOpen(false)
                    setIsDateSelectorOpen(true)
                  }}
                  className="flex-1 py-4 text-sm font-extrabold text-black hover:bg-gray-50 rounded-2xl transition-all border border-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomDateApply}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-extrabold shadow-md hover:bg-black/90 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Complaints Filter Popup */}
      <AnimatePresence>
        {isComplaintsFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9999]"
              onClick={() => setIsComplaintsFilterOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[9999] h-[65vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-5 border-b border-gray-100">
                <h2 className="text-lg font-extrabold text-black text-center">Filters</h2>
              </div>
              <div className="flex-1 overflow-hidden flex">
                {/* Left Column - Filter Categories */}
                <div className="w-32 bg-gray-50 border-r border-gray-100 flex flex-col">
                  {[
                    { id: "issueType", label: "Issue Type" },
                    { id: "reasons", label: "Reasons" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedComplaintsFilterCategory(cat.id)}
                      className={`p-5 text-left text-xs font-bold uppercase tracking-widest transition-all ${selectedComplaintsFilterCategory === cat.id
                        ? "bg-white text-black border-l-4 border-black"
                        : "text-gray-400 hover:bg-white"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Right Column - Filter Options */}
                <div className="flex-1 overflow-y-auto">
                  {selectedComplaintsFilterCategory === "issueType" && (
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={complaintsSearchQuery}
                            onChange={(e) => setComplaintsSearchQuery(e.target.value)}
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {["Expired", "Dismissed", "Winback", "Open", "Resolved"].filter(option =>
                          option.toLowerCase().includes(complaintsSearchQuery.toLowerCase())
                        ).map((option) => (
                          <label key={option} className="flex items-center gap-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={complaintsFilterValues.issueType.includes(option.toLowerCase())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setComplaintsFilterValues(prev => ({
                                    ...prev,
                                    issueType: [...prev.issueType, option.toLowerCase()]
                                  }))
                                } else {
                                  setComplaintsFilterValues(prev => ({
                                    ...prev,
                                    issueType: prev.issueType.filter(t => t !== option.toLowerCase())
                                  }))
                                }
                              }}
                              className="w-5 h-5 text-black border-gray-100 focus:ring-black rounded"
                            />
                            <span className="text-sm text-black font-bold">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedComplaintsFilterCategory === "reasons" && (
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={complaintsSearchQuery}
                            onChange={(e) => setComplaintsSearchQuery(e.target.value)}
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {[
                          "Wrong item(s) delivered",
                          "Issue with food quantity",
                          "Poor packaging or spillage",
                          "Order delayed",
                          "Item(s) missing or not delivered",
                          "Poor taste or quality"
                        ].filter(option =>
                          option.toLowerCase().includes(complaintsSearchQuery.toLowerCase())
                        ).map((option) => (
                          <label key={option} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={complaintsFilterValues.reasons.includes(option)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setComplaintsFilterValues(prev => ({
                                    ...prev,
                                    reasons: [...prev.reasons, option]
                                  }))
                                } else {
                                  setComplaintsFilterValues(prev => ({
                                    ...prev,
                                    reasons: prev.reasons.filter(r => r !== option)
                                  }))
                                }
                              }}
                              className="w-5 h-5 text-black border-gray-100 focus:ring-black rounded"
                            />
                            <span className="text-sm text-black font-bold">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer - Action Buttons */}
              <div className="border-t border-gray-100 px-6 py-6 flex gap-4">
                <button
                  onClick={handleComplaintsFilterReset}
                  className="flex-1 py-4 text-sm font-extrabold text-black hover:bg-gray-50 rounded-2xl transition-all border border-gray-100"
                >
                  Clear all
                </button>
                <button
                  onClick={handleComplaintsFilterApply}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-extrabold shadow-md hover:bg-black/90 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavOrders />
    </div>
  )
}
