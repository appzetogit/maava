import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { MapPin, ArrowLeft, Edit, ShoppingBag, Calendar, ToggleLeft, ToggleRight } from "lucide-react"
import { adminAPI } from "@/lib/api"
import { getGoogleMapsApiKey } from "@/lib/utils/googleMapsApiKey"
import { Loader } from "@googlemaps/js-api-loader"
import { toast } from "sonner"

export default function ViewHibermartZone() {
    const navigate = useNavigate()
    const { id } = useParams()
    const mapRef = useRef(null)
    const [zone, setZone] = useState(null)
    const [loading, setLoading] = useState(true)
    const [mapLoading, setMapLoading] = useState(true)
    const [storeLocation, setStoreLocation] = useState(null)

    useEffect(() => {
        fetchZone()
    }, [id])

    const fetchZone = async () => {
        try {
            setLoading(true)
            const [zoneResponse, storeResponse] = await Promise.all([
                adminAPI.getHibermartZoneById(id),
                adminAPI.getHibermartStoreLocation().catch(() => null)
            ])
            if (zoneResponse.data?.success && zoneResponse.data.data?.zone) {
                setZone(zoneResponse.data.data.zone)
                const storeData = storeResponse?.data?.data || storeResponse?.data
                if (storeData?.location) {
                    const loc = storeData.location
                    setStoreLocation({
                        lat: loc.latitude ?? loc.coordinates?.[1],
                        lng: loc.longitude ?? loc.coordinates?.[0],
                        name: storeData.name || "Hibermart Store"
                    })
                }
                loadGoogleMaps(zoneResponse.data.data.zone, storeData)
            }
        } catch (err) {
            toast.error("Failed to load zone")
            navigate("/admin/hibermart-zone-setup")
        } finally {
            setLoading(false)
        }
    }

    const loadGoogleMaps = async (zoneData, storeDoc) => {
        try {
            const apiKey = await getGoogleMapsApiKey()
            let retries = 0
            while (!window.google && retries < 50) {
                await new Promise(r => setTimeout(r, 100))
                retries++
            }
            const google = window.google?.maps ? window.google : await new Loader({
                apiKey, version: "weekly", libraries: ["places"]
            }).load()
            initMap(google, zoneData, storeDoc)
        } catch (err) {
            setMapLoading(false)
        }
    }

    const initMap = (google, zoneData, storeDoc) => {
        if (!mapRef.current || !zoneData?.coordinates?.length) { setMapLoading(false); return }
        const path = zoneData.coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }))
        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))

        const map = new google.maps.Map(mapRef.current, {
            zoom: 12, mapTypeControl: true, zoomControl: true,
            streetViewControl: false, fullscreenControl: true, gestureHandling: 'greedy'
        })
        map.fitBounds(bounds)

        new google.maps.Polygon({
            map, paths: path,
            fillColor: '#f97316', fillOpacity: 0.25,
            strokeColor: '#ea580c', strokeWeight: 2.5,
            editable: false
        })
        const storeLat = storeDoc?.location?.latitude ?? storeDoc?.location?.coordinates?.[1]
        const storeLng = storeDoc?.location?.longitude ?? storeDoc?.location?.coordinates?.[0]
        if (storeLat && storeLng) {
            new google.maps.Marker({
                map,
                position: { lat: storeLat, lng: storeLng },
                title: storeDoc?.name || "Hibermart Store"
            })
        }
        setMapLoading(false)
    }

    const handleToggle = async () => {
        try {
            await adminAPI.toggleHibermartZoneStatus(id)
            toast.success(`Zone ${zone.isActive ? "deactivated" : "activated"}`)
            setZone(prev => ({ ...prev, isActive: !prev.isActive }))
        } catch {
            toast.error("Failed to update status")
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Loading HiberMart zone...</p>
            </div>
        </div>
    )

    if (!zone) return null

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 lg:p-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/admin/hibermart-zone-setup")}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{zone.name}</h1>
                                <p className="text-sm text-slate-500">
                                    <code className="bg-orange-50 text-orange-700 px-1 rounded font-mono text-xs">hibermart_zones</code>
                                    {zone.serviceLocation ? ` · ${zone.serviceLocation}` : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggle}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${zone.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                }`}
                        >
                            {zone.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {zone.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                            onClick={() => navigate(`/admin/hibermart-zone-setup/edit/${id}`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                        >
                            <Edit className="w-4 h-4" /> Edit Zone
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Details */}
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-slate-700 mb-4">Zone Info</h2>
                            <div className="space-y-3">
                                {[
                                    {
                                        label: "Status", value: (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${zone.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                }`}>{zone.isActive ? "Active" : "Inactive"}</span>
                                        )
                                    },
                                    { label: "Country", value: zone.country },
                                    { label: "Zone Name", value: zone.zoneName || zone.name },
                                    { label: "Unit", value: <span className="capitalize">{zone.unit || "kilometer"}</span> },
                                    { label: "Service Location", value: zone.serviceLocation || "—" },
                                    { label: "Polygon Points", value: zone.coordinates?.length || 0 },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">{row.label}</span>
                                        <span className="font-medium text-slate-800">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> Timestamps
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Created</span>
                                    <span className="text-slate-700">{zone.createdAt ? new Date(zone.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Updated</span>
                                    <span className="text-slate-700">{zone.updatedAt ? new Date(zone.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Coordinates list */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-500" /> Coordinates ({zone.coordinates?.length || 0} points)
                            </h2>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {(zone.coordinates || []).map((c, i) => (
                                    <div key={i} className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1.5 rounded">
                                        {i + 1}. {c.latitude?.toFixed(6)}, {c.longitude?.toFixed(6)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-700">Zone Map</h2>
                                <span className="text-xs text-slate-400">Orange boundary = HiberMart zone area</span>
                            </div>
                            <div className="relative" style={{ height: '500px' }}>
                                {mapLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                                        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                                    </div>
                                )}
                                <div ref={mapRef} className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
