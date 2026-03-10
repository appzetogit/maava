import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Phone,
  Search,
  ChevronRight,
  Filter,
  Check,
  X,
  CreditCard,
  Briefcase
} from "lucide-react"
import { adminAPI } from "@/lib/api"
import { toast } from "sonner"

export default function HibermartOrderApproval() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processingId, setProcessingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPendingHibermartOrders({ status: statusFilter })
      if (response.data?.success) {
        setOrders(response.data.data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (order) => {
    const orderId = order._id || order.id;
    try {
      setProcessingId(orderId)
      const response = await adminAPI.approveHibermartOrder(orderId)
      if (response.data?.success) {
        toast.success("Order approved successfully!")
        fetchOrders()
        if (selectedOrder?._id === orderId) setSelectedOrder(null)
      }
    } catch (error) {
      console.error("Approval error:", error)
      const msg = error.response?.data?.message || "Failed to approve order"
      toast.error(msg)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!selectedOrder) return
    const orderId = selectedOrder._id || selectedOrder.id;

    try {
      setProcessingId(orderId)
      const response = await adminAPI.rejectHibermartOrder(orderId, rejectReason)
      if (response.data?.success) {
        toast.success("Order rejected")
        setShowRejectModal(false)
        setRejectReason("")
        setSelectedOrder(null)
        fetchOrders()
      }
    } catch (error) {
      console.error("Rejection error:", error)
      toast.error(error.response?.data?.message || "Failed to reject order")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredOrders = orders.filter(o =>
    o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
         <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 text-[#2D3748] font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb style Header */}
        <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Hibermart Order Approval</h1>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            
            {/* Inner Header with Title and Filters */}
            <div className="p-6 border-b border-neutral-50">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg font-bold">
                        {statusFilter === 'pending' ? 'Pending Orders' : 
                         statusFilter === 'approved' ? 'Approved Orders' : 'Rejected Orders'}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                        {orders.length}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID or customer"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-neutral-300"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-4 pr-10 py-2.5 bg-neutral-50 border-none rounded-xl text-sm font-bold appearance-none cursor-pointer hover:bg-neutral-100 transition-colors"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5568' stroke-width='2' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                        >
                            <option value="pending">Pending View</option>
                            <option value="approved">Approved (Last 7 Days)</option>
                            <option value="rejected">Rejected (Last 7 Days)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#EBF4FF] text-[#4A5568]">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider w-[6%]">S.NO</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">ORDER ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">CUSTOMER</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">ITEMS</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">TOTAL</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">REQUESTED DATE</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <Package className="w-10 h-10 text-neutral-100 mb-2" />
                                        <p className="text-sm font-medium text-neutral-400">No orders found in this category</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order, index) => (
                                <tr key={order._id} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="px-6 py-5 text-sm font-medium text-neutral-500">{index + 1}</td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-bold text-neutral-700 tracking-tight">{order.orderId}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-neutral-800">{order.userId?.name || "N/A"}</span>
                                            <span className="text-[11px] text-neutral-400">{order.userId?.phone || "No Phone"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-neutral-700">
                                        {order.items?.length || 0}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-neutral-700">
                                        Rs {order.pricing?.total || 0}.00
                                    </td>
                                    <td className="px-6 py-5 text-sm text-neutral-500">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => setSelectedOrder(order)}
                                                className="w-8 h-8 rounded-lg bg-[#0066CC] flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            
                                            {statusFilter === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleApprove(order)}
                                                        disabled={processingId === order._id}
                                                        className="w-8 h-8 rounded-lg bg-[#28A745] flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                                                        title="Approve Order"
                                                    >
                                                        {processingId === order._id ? (
                                                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedOrder(order); setShowRejectModal(true); }}
                                                        className="w-8 h-8 rounded-lg bg-[#DC3545] flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
                                                        title="Reject Order"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !showRejectModal && setSelectedOrder(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <h3 className="text-lg font-bold">Order Details: {selectedOrder.orderId}</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-neutral-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer & Address */}
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Customer Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{selectedOrder.userId?.name}</p>
                                        <p className="text-[11px] text-neutral-500">{selectedOrder.userId?.email || 'No Email'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold">{selectedOrder.userId?.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Delivery Address</h4>
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex gap-3">
                                <MapPin className="w-4 h-4 text-rose-500 mt-0.5" />
                                <p className="text-sm leading-relaxed text-neutral-600">
                                    {selectedOrder.address?.house}, {selectedOrder.address?.street}, {selectedOrder.address?.area}, {selectedOrder.address?.city}
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Payment & Status */}
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Payment Details</h4>
                            <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-500">Method</span>
                                    <span className="text-xs font-bold uppercase">{selectedOrder.payment?.method}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-500">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedOrder.payment?.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {selectedOrder.payment?.status}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Order Status</h4>
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                                    selectedOrder.status === 'delivered' ? 'bg-emerald-500 text-white' : 
                                    selectedOrder.status === 'cancelled' ? 'bg-rose-500 text-white' : 
                                    'bg-blue-500 text-white'
                                }`}>
                                    {selectedOrder.status}
                                </span>
                                <span className="text-xs font-medium text-neutral-400">
                                    Placed {formatDate(selectedOrder.createdAt)}
                                </span>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Items Section */}
                <section>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-4">Ordered Items ({selectedOrder.items?.length})</h4>
                    <div className="space-y-3">
                        {selectedOrder.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-neutral-100 rounded-xl">
                                <div className="w-12 h-12 bg-neutral-50 rounded-lg flex items-center justify-center p-2">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <Package className="w-6 h-6 text-neutral-200" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-neutral-800">{item.name}</p>
                                    <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-neutral-900">Rs {item.price * item.quantity}.00</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="p-4 bg-neutral-900 rounded-2xl text-white flex items-center justify-between">
                    <span className="text-sm font-medium">Grand Total</span>
                    <span className="text-2xl font-bold">Rs {selectedOrder.pricing?.total || 0}.00</span>
                </div>
              </div>

              {statusFilter === 'pending' && (
                <div className="px-6 py-5 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                    <button
                        onClick={() => setShowRejectModal(true)}
                        className="flex-1 py-3 bg-white border border-rose-100 text-rose-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-50 transition-all"
                    >
                        Reject Order
                    </button>
                    <button
                        onClick={() => handleApprove(selectedOrder)}
                        disabled={processingId}
                        className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processingId === selectedOrder._id ? "Processing..." : "Approve & Assign Delivery"}
                    </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRejectModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold text-[#2D3748] mb-2">Rejection Reason</h3>
              <p className="text-xs text-neutral-500 mb-4">Provide a reason for cancelling this order.</p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. Out of stock, Store closing...)"
                className="w-full h-32 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:border-blue-500 focus:ring-0 transition-all resize-none mb-4"
              />

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowRejectModal(false)} className="py-3 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-bold uppercase">Back</button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processingId}
                  className="py-3 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase shadow-md hover:bg-rose-600 disabled:opacity-50 transition-all"
                >
                  Reject Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
