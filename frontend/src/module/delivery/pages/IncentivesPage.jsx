import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Award, Loader2 } from "lucide-react"
import { deliveryAPI } from "@/lib/api"

export default function IncentivesPage() {
  const navigate = useNavigate()
  
  const [activeEarningAddons, setActiveEarningAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch active offers
        const offersRes = await deliveryAPI.getActiveEarningAddons()
        if (offersRes?.data?.success && offersRes?.data?.data?.activeOffers) {
          // Get all active offers, sort them by required orders
          const offers = offersRes.data.data.activeOffers
            .filter(offer => offer.isValid || offer.isUpcoming || offer.status === 'active')
            .sort((a, b) => (a.requiredOrders || 0) - (b.requiredOrders || 0))
            
          setActiveEarningAddons(offers)
        }

        // Fetch wallet to get total earnings
        const walletRes = await deliveryAPI.getWallet()
        if (walletRes?.data?.success && walletRes?.data?.data) {
          const walletData = walletRes.data.data
          // Calculate weekly earnings from transactions or just use total balance
          const transactions = walletData.transactions || []
          
          const now = new Date()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          
          const weeklyEarn = transactions
            .filter(t => {
              if ((t.type !== 'payment' && t.type !== 'earning_addon') || t.status !== 'Completed') return false
              const tDate = t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : null)
              if (!tDate) return false
              return tDate >= startOfWeek && tDate <= now
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0)
            
          setTotalEarnings(weeklyEarn)
        }
      } catch (error) {
        console.error("Failed to fetch incentives data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Refresh interval
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && activeEarningAddons.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  const timeDisplay = "All Day"

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans pb-24">
      {/* Green Header Section */}
      <div className="bg-[#1f9f52] px-4 pt-4 pb-6 text-white relative">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 p-1 -ml-1 inline-block"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="mb-1">
          <span className="text-sm font-medium">Today only</span>
        </div>

        <h1 className="text-2xl font-bold mb-4 tracking-tight">
          {activeEarningAddons.length > 0
            ? `Earn up to ₹${activeEarningAddons[activeEarningAddons.length - 1]?.earningAmount || 0} extra!`
            : "No active incentives right now"}
        </h1>

        {activeEarningAddons.length > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-[#177a3d] px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">{timeDisplay}</span>
          </div>
        )}
      </div>

      {/* Total Earnings Section */}
      <div className="bg-[#dcfce7] px-4 py-4 flex items-center justify-between shadow-sm relative z-10">
        <span className="text-[#166534] font-bold text-sm tracking-wide">Total earnings</span>
        <span className="text-[#166534] font-bold text-lg">₹{totalEarnings.toFixed(0)}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Award className="w-5 h-5 text-gray-600" />
          <span className="font-bold text-gray-700 text-sm tracking-wide">Incentives</span>
        </div>

        {/* Card for Tiers */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-5">
          {activeEarningAddons.length > 0 ? (
            <div>
              {activeEarningAddons.map((addon, idx) => {
                const earningAmount = addon.earningAmount || 0
                const requiredOrders = addon.requiredOrders || 0
                const currentOrders = addon.currentOrders || 0
                const progress = requiredOrders > 0 ? currentOrders / requiredOrders : 0
                const remainingOrders = Math.max(0, requiredOrders - currentOrders)
                
                return (
                  <div key={addon._id || idx} className={idx !== activeEarningAddons.length - 1 ? "mb-6 pb-6 border-b border-gray-200" : ""}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-extrabold text-gray-800 text-[17px]">
                        Earn an extra ₹{earningAmount}
                      </h3>
                      <span className="text-sm text-gray-600 font-medium">
                        {currentOrders}/{requiredOrders} bookings
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-[#dcfce7] rounded-full overflow-hidden mb-2 relative">
                      <div 
                        className="h-full bg-[#22c55e] transition-all duration-500 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
                      />
                      {/* Empty state visual dot at the end */}
                      {currentOrders === 0 && (
                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#dcfce7]" />
                      )}
                    </div>

                    {/* Status Text */}
                    {currentOrders < requiredOrders ? (
                      <p className="text-sm font-bold text-[#16a34a] mt-2">
                        {remainingOrders} more bookings to go
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-[#16a34a] mt-2">
                        Target completed!
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>You have no active incentives.</p>
              <p className="text-sm mt-1">Check back later for new offers.</p>
            </div>
          )}
        </div>

        {/* Things to keep in mind */}
        <div className="mt-8 px-1 pb-4">
          <h3 className="font-bold text-gray-700 text-[15px] tracking-wide mb-4">Things to keep in mind</h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-[13px] text-gray-600 font-medium leading-relaxed">
              <span className="text-gray-400 mt-0.5 shrink-0">▶</span>
              <p>1. Only rides accepted within the specified time window will be eligible.</p>
            </li>
            <li className="flex gap-3 text-[13px] text-gray-600 font-medium leading-relaxed">
              <span className="text-gray-400 mt-0.5 shrink-0">▶</span>
              <p>2. Any fraud related activity will lead to penalties, loss of incentives and possible account blocking.</p>
            </li>
            <li className="flex gap-3 text-[13px] text-gray-600 font-medium leading-relaxed">
              <span className="text-gray-400 mt-0.5 shrink-0">▶</span>
              <p>3. Maava reserves the right to modify the incentive scheme at any time.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
