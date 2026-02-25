import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, XCircle, Eye, Loader2, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminAPI } from "@/lib/api"
import { toast } from "sonner"

export default function HibermartOrderApproval() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPendingHibermartOrders()
      const data = response?.data?.data?.orders || response?.data?.orders || []
      setOrders(data)
    } catch (error) {
      console.error("Error fetching Hibermart orders:", error)
      toast.error("Failed to load Hibermart order approvals")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const query = searchQuery.toLowerCase().trim()
    return orders.filter((order) =>
      order.orderId?.toLowerCase().includes(query) ||
      order.userId?.name?.toLowerCase().includes(query) ||
      order.userId?.phone?.toLowerCase().includes(query) ||
      order.restaurantName?.toLowerCase().includes(query)
    )
  }, [orders, searchQuery])

  const totalOrders = filteredOrders.length

  const handleApprove = async (order) => {
    try {
      setProcessing(true)
      await adminAPI.approveHibermartOrder(order._id || order.id || order.orderId)
      toast.success("Order moved to processing and sent to delivery partners")
      await fetchOrders()
      setShowDetailModal(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error("Error approving order:", error)
      toast.error(error?.response?.data?.message || "Failed to approve order")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    try {
      setProcessing(true)
      await adminAPI.rejectHibermartOrder(selectedOrder._id || selectedOrder.id || selectedOrder.orderId, rejectReason)
      toast.success("Order rejected")
      await fetchOrders()
      setShowRejectModal(false)
      setShowDetailModal(false)
      setSelectedOrder(null)
      setRejectReason("")
    } catch (error) {
      console.error("Error rejecting order:", error)
      toast.error(error?.response?.data?.message || "Failed to reject order")
    } finally {
      setProcessing(false)
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleRejectClick = (order) => {
    setSelectedOrder(order)
    setShowRejectModal(true)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            Hibermart Order Approval
          </h1>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Pending Orders</h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {totalOrders}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by order ID or customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#006fbd] focus:ring-1 focus:ring-[#006fbd]"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#006fbd]" />
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead style={{ backgroundColor: "rgba(0, 111, 189, 0.1)" }}>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Requested Date
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-8 text-center text-sm text-gray-500">
                          No pending Hibermart orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <tr key={order._id || order.id || order.orderId} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold">
                            {order.orderId || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">{order.userId?.name || "Customer"}</div>
                              <div className="text-gray-500 text-xs">{order.userId?.phone || "-"}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {order.items?.length || 0}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold">
                            Rs {Number(order.pricing?.total || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white transition-colors"
                                style={{ backgroundColor: "#006fbd" }}
                                onMouseEnter={(e) => (e.target.style.backgroundColor = "#005a9e")}
                                onMouseLeave={(e) => (e.target.style.backgroundColor = "#006fbd")}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApprove(order)}
                                disabled={processing}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Update to Processing"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectClick(order)}
                                disabled={processing}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 bg-white">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Hibermart Order Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Review the order details before approval.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">Customer</h3>
                <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {selectedOrder.userId?.name || "Customer"}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Phone:</span> {selectedOrder.userId?.phone || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <p className="text-sm text-gray-900">{selectedOrder.orderId || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <p className="text-sm text-gray-900 font-semibold">Rs {Number(selectedOrder.pricing?.total || 0).toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={`${item.itemId || item.name || idx}`} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-gray-500 ml-2">x{item.quantity}</span>
                        </div>
                        <span className="text-gray-700">Rs {Number(item.price || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowDetailModal(false)
                setSelectedOrder(null)
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleRejectClick(selectedOrder)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => handleApprove(selectedOrder)}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Update to Processing"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md p-0 bg-white">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Reject Order
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Please provide a reason for rejecting this order.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#006fbd] focus:border-[#006fbd]"
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason("")
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Reject"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
