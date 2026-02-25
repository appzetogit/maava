import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight, ShoppingBag } from "lucide-react"
import { adminAPI } from "@/lib/api"
import { toast } from "sonner"

export default function HibermartZoneSetup() {
    const navigate = useNavigate()
    const [zones, setZones] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => { fetchZones() }, [])

    const fetchZones = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getHibermartZones()
            if (response.data?.success && response.data.data?.zones) {
                setZones(response.data.data.zones)
            }
        } catch (error) {
            console.error("Error fetching HiberMart zones:", error)
            toast.error("Failed to load zones")
            setZones([])
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (zoneId) => {
        if (!window.confirm("Are you sure you want to delete this zone?")) return
        try {
            await adminAPI.deleteHibermartZone(zoneId)
            toast.success("Zone deleted successfully")
            fetchZones()
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete zone")
        }
    }

    const handleToggle = async (zoneId, currentStatus) => {
        try {
            await adminAPI.toggleHibermartZoneStatus(zoneId)
            toast.success(`Zone ${currentStatus ? "deactivated" : "activated"}`)
            fetchZones()
        } catch (error) {
            toast.error("Failed to update zone status")
        }
    }

    const filtered = zones.filter(z =>
        z.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.serviceLocation?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">HiberMart Zone Setup</h1>
                            <p className="text-sm text-slate-500">Manage delivery zones for HiberMart (In-Mart)</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/admin/hibermart-zone-setup/add")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Zone
                    </button>
                </div>

                {/* Info banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-900">Separate Zone System</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            HiberMart zones are stored in a completely separate MongoDB collection
                            (<code className="bg-amber-100 px-1 rounded font-mono">hibermart_zones</code>) and are
                            independent from restaurant delivery zones. Only In-Mart products use these zones.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search zones by name or location..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                        />
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Zones", value: zones.length, color: "bg-blue-50 text-blue-700 border-blue-100" },
                        { label: "Active", value: zones.filter(z => z.isActive).length, color: "bg-green-50 text-green-700 border-green-100" },
                        { label: "Inactive", value: zones.filter(z => !z.isActive).length, color: "bg-red-50 text-red-700 border-red-100" },
                        { label: "Collection", value: "hibermart_zones", color: "bg-orange-50 text-orange-700 border-orange-100" },
                    ].map((stat, i) => (
                        <div key={i} className={`rounded-xl border p-4 ${stat.color}`}>
                            <p className="text-xs font-medium opacity-70">{stat.label}</p>
                            <p className="text-xl font-bold mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Zones Grid */}
                {loading ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 text-sm">Loading HiberMart zones...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">
                            {searchQuery ? "No zones match your search" : "No HiberMart zones yet"}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {searchQuery
                                ? "Try a different search term"
                                : "Create your first HiberMart delivery zone to enable In-Mart deliveries"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate("/admin/hibermart-zone-setup/add")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" /> Add First Zone
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(zone => (
                            <div
                                key={zone._id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{zone.name || "Unnamed Zone"}</h3>
                                            <p className="text-xs text-slate-500">{zone.serviceLocation || "No location set"}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${zone.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                        }`}>
                                        {zone.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Meta */}
                                <div className="space-y-1.5 text-sm text-slate-600 mb-4">
                                    <div className="flex justify-between">
                                        <span>Unit</span>
                                        <span className="font-medium text-slate-800 capitalize">{zone.unit || "kilometer"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Points</span>
                                        <span className="font-medium text-slate-800">{zone.coordinates?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Country</span>
                                        <span className="font-medium text-slate-800">{zone.country || "India"}</span>
                                    </div>
                                    {zone.zoneName && (
                                        <div className="flex justify-between">
                                            <span>Zone Name</span>
                                            <span className="font-medium text-slate-800">{zone.zoneName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => navigate(`/admin/hibermart-zone-setup/view/${zone._id}`)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" /> View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/hibermart-zone-setup/edit/${zone._id}`)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggle(zone._id, zone.isActive)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                        title={zone.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {zone.isActive
                                            ? <ToggleRight className="w-4 h-4" />
                                            : <ToggleLeft className="w-4 h-4" />}
                                        {zone.isActive ? "Disable" : "Enable"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(zone._id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
