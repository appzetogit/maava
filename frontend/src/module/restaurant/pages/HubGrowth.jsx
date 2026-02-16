import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { ChevronRight, Menu, Percent } from "lucide-react"
import BottomNavOrders from "../components/BottomNavOrders"

export default function HubGrowth() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Grow your business</h1>
          <button
            onClick={() => navigate("/restaurant/explore")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {/* Build your own section */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Build your own</h2>

          <div className="space-y-3">
            {/* Offers and discounts card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/restaurant/hub-growth/create-offers")}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 flex items-center gap-4 border border-blue-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <motion.div
                className="shrink-0"
                whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Percent className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </motion.div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">Offers and discounts</h3>
                <p className="text-sm text-gray-600">Start your own offers and grow your business</p>
              </div>
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-blue-600 shrink-0" />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      <BottomNavOrders />
    </div>
  )
}
