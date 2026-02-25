import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { MapPin, ArrowLeft, Save, X, Hand, Shapes, Search, ShoppingBag } from "lucide-react"
import { adminAPI } from "@/lib/api"
import { getGoogleMapsApiKey } from "@/lib/utils/googleMapsApiKey"
import { Loader } from "@googlemaps/js-api-loader"
import { toast } from "sonner"

export default function AddHibermartZone() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = !!id && !window.location.pathname.includes('/view/')
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const drawingManagerRef = useRef(null)
    const polygonRef = useRef(null)
    const markersRef = useRef([])
    const pathMarkersRef = useRef([])
    const autocompleteInputRef = useRef(null)
    const autocompleteRef = useRef(null)
    const existingPolygonsRef = useRef([])

    const [mapLoading, setMapLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [coordinates, setCoordinates] = useState([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [locationSearch, setLocationSearch] = useState("")
    const [formData, setFormData] = useState({
        country: "India",
        zoneName: "",
        unit: "kilometer",
    })

    useEffect(() => {
        loadGoogleMaps()
        if (isEditMode && id) fetchZone()
        fetchExistingZones()
    }, [id, isEditMode])

    // Draw existing polygon in edit mode once map loads
    useEffect(() => {
        if (isEditMode && coordinates.length >= 3 && mapInstanceRef.current && window.google && !mapLoading) {
            setTimeout(() => {
                if (mapInstanceRef.current && window.google) {
                    if (drawingManagerRef.current) {
                        drawingManagerRef.current.setDrawingMode(null)
                        setIsDrawing(false)
                    }
                    drawExistingPolygon(window.google, mapInstanceRef.current, coordinates)
                }
            }, 500)
        }
    }, [isEditMode, coordinates.length, mapLoading])

    // Places Autocomplete
    useEffect(() => {
        if (!mapLoading && mapInstanceRef.current && autocompleteInputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'in' }
            })
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                if (place.geometry?.location && mapInstanceRef.current) {
                    mapInstanceRef.current.setCenter(place.geometry.location)
                    mapInstanceRef.current.setZoom(15)
                    setLocationSearch(place.formatted_address || place.name || "")
                }
            })
            autocompleteRef.current = autocomplete
        }
    }, [mapLoading])

    const fetchExistingZones = async () => {
        try {
            const response = await adminAPI.getHibermartZones({ limit: 1000 })
            if (response.data?.success && response.data.data?.zones) {
                const zones = isEditMode && id
                    ? response.data.data.zones.filter(z => z._id !== id)
                    : response.data.data.zones
                // Show other zones on map as reference
                existingPolygonsRef.current = zones
            }
        } catch (err) {
            console.error("Error fetching existing HiberMart zones:", err)
        }
    }

    const fetchZone = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getHibermartZoneById(id)
            if (response.data?.success && response.data.data?.zone) {
                const z = response.data.data.zone
                setFormData({ country: z.country || "India", zoneName: z.name || z.zoneName || "", unit: z.unit || "kilometer" })
                if (z.coordinates?.length > 0) setCoordinates(z.coordinates)
            }
        } catch (err) {
            toast.error("Failed to load zone")
            navigate("/admin/hibermart-zone-setup")
        } finally {
            setLoading(false)
        }
    }

    const loadGoogleMaps = async () => {
        try {
            const apiKey = await getGoogleMapsApiKey()
            let retries = 0
            while (!window.google && retries < 50) {
                await new Promise(r => setTimeout(r, 100))
                retries++
            }
            if (window.google?.maps) { initializeMap(window.google); return }
            if (apiKey) {
                const loader = new Loader({ apiKey, version: "weekly", libraries: ["places", "drawing", "geometry"] })
                const google = await loader.load()
                initializeMap(google)
            } else { setMapLoading(false) }
        } catch (err) {
            console.error("Error loading Google Maps:", err)
            setMapLoading(false)
        }
    }

    const initializeMap = (google) => {
        if (!mapRef.current) return
        const map = new google.maps.Map(mapRef.current, {
            center: { lat: 20.5937, lng: 78.9629 },
            zoom: 5,
            mapTypeControl: true,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'greedy',
        })
        mapInstanceRef.current = map

        // Drawing manager
        if (google.maps.drawing) {
            const dm = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                polygonOptions: {
                    fillColor: '#f97316',
                    fillOpacity: 0.25,
                    strokeColor: '#ea580c',
                    strokeWeight: 2,
                    editable: true,
                    draggable: true
                }
            })
            dm.setMap(map)
            drawingManagerRef.current = dm

            google.maps.event.addListener(dm, 'polygoncomplete', (polygon) => {
                if (polygonRef.current) polygonRef.current.setMap(null)
                polygonRef.current = polygon
                dm.setDrawingMode(null)
                setIsDrawing(false)
                updateCoordinatesFromPolygon(polygon)
                google.maps.event.addListener(polygon.getPath(), 'set_at', () => updateCoordinatesFromPolygon(polygon))
                google.maps.event.addListener(polygon.getPath(), 'insert_at', () => updateCoordinatesFromPolygon(polygon))
                google.maps.event.addListener(polygon.getPath(), 'remove_at', () => updateCoordinatesFromPolygon(polygon))
            })
        }

        setMapLoading(false)

        // Draw existing zones as grey reference polygons
        setTimeout(() => {
            if (existingPolygonsRef.current?.length > 0) {
                existingPolygonsRef.current.forEach(zone => {
                    if (zone.coordinates?.length >= 3) {
                        const path = zone.coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }))
                        new google.maps.Polygon({
                            map,
                            paths: path,
                            fillColor: '#94a3b8',
                            fillOpacity: 0.15,
                            strokeColor: '#64748b',
                            strokeWeight: 1.5,
                            clickable: false
                        })
                    }
                })
            }
        }, 1000)
    }

    const updateCoordinatesFromPolygon = (polygon) => {
        const path = polygon.getPath()
        const coords = []
        for (let i = 0; i < path.getLength(); i++) {
            const p = path.getAt(i)
            coords.push({ latitude: p.lat(), longitude: p.lng() })
        }
        setCoordinates(coords)
    }

    const drawExistingPolygon = (google, map, coords) => {
        if (polygonRef.current) polygonRef.current.setMap(null)
        const path = coords.map(c => ({ lat: c.latitude, lng: c.longitude }))
        const polygon = new google.maps.Polygon({
            map,
            paths: path,
            fillColor: '#f97316',
            fillOpacity: 0.25,
            strokeColor: '#ea580c',
            strokeWeight: 2,
            editable: true,
            draggable: true
        })
        polygonRef.current = polygon
        google.maps.event.addListener(polygon.getPath(), 'set_at', () => updateCoordinatesFromPolygon(polygon))
        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => updateCoordinatesFromPolygon(polygon))
        // Fit bounds
        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        map.fitBounds(bounds)
    }

    const handleStartDrawing = () => {
        if (!drawingManagerRef.current) return
        if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; setCoordinates([]) }
        drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON)
        setIsDrawing(true)
    }

    const handleStopDrawing = () => {
        if (!drawingManagerRef.current) return
        drawingManagerRef.current.setDrawingMode(null)
        setIsDrawing(false)
    }

    const handleClearPolygon = () => {
        if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null }
        setCoordinates([])
        setIsDrawing(false)
        if (drawingManagerRef.current) drawingManagerRef.current.setDrawingMode(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.zoneName.trim()) { toast.error("Please enter a zone name"); return }
        if (coordinates.length < 3) { toast.error("Please draw at least 3 points on the map"); return }

        try {
            setLoading(true)
            const validCoords = coordinates.map(c => ({
                latitude: parseFloat(c.latitude),
                longitude: parseFloat(c.longitude)
            }))
            const payload = {
                name: formData.zoneName,
                zoneName: formData.zoneName,
                country: formData.country,
                unit: formData.unit || "kilometer",
                coordinates: validCoords,
                isActive: true
            }
            if (isEditMode && id) {
                await adminAPI.updateHibermartZone(id, payload)
                toast.success("HiberMart zone updated successfully!")
            } else {
                await adminAPI.createHibermartZone(payload)
                toast.success("HiberMart zone created successfully!")
            }
            navigate("/admin/hibermart-zone-setup")
        } catch (err) {
            console.error("Zone save error:", err)
            toast.error(err.response?.data?.message || "Failed to save zone")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 lg:p-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate("/admin/hibermart-zone-setup")}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {isEditMode ? "Edit HiberMart Zone" : "Add HiberMart Zone"}
                            </h1>
                            <p className="text-sm text-slate-500">Stored in{" "}
                                <code className="bg-orange-50 text-orange-700 px-1 rounded font-mono text-xs">hibermart_zones</code>
                                {" "}collection — separate from restaurant zones
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Form */}
                    <div className="lg:col-span-1 space-y-4">

                        {/* Zone Details */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-500" /> Zone Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Zone Name *</label>
                                    <input
                                        type="text"
                                        value={formData.zoneName}
                                        onChange={e => setFormData(p => ({ ...p, zoneName: e.target.value }))}
                                        placeholder="e.g. Indore North HiberMart Zone"
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Country</label>
                                    <select
                                        value={formData.country}
                                        onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                    >
                                        <option value="India">India</option>
                                        <option value="United States">United States</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Distance Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                    >
                                        <option value="kilometer">Kilometer</option>
                                        <option value="miles">Miles</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Coordinates Info */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-slate-700 mb-3">Zone Boundary</h2>
                            <div className={`px-4 py-3 rounded-lg text-sm font-medium mb-3 ${coordinates.length >= 3
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                                }`}>
                                {coordinates.length >= 3
                                    ? `✅ ${coordinates.length} points defined — ready to save`
                                    : `Draw the zone polygon on the map (min 3 points). Current: ${coordinates.length}`
                                }
                            </div>
                            {coordinates.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {coordinates.map((c, i) => (
                                        <div key={i} className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                                            {i + 1}. {c.latitude?.toFixed(6)}, {c.longitude?.toFixed(6)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drawing Controls */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-slate-700 mb-3">Drawing Tools</h2>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={isDrawing ? handleStopDrawing : handleStartDrawing}
                                    disabled={mapLoading}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${isDrawing
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                        } disabled:opacity-50`}
                                >
                                    {isDrawing ? <><Hand className="w-4 h-4" /> Stop Drawing</> : <><Shapes className="w-4 h-4" /> Draw Zone</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearPolygon}
                                    disabled={coordinates.length === 0}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" /> Clear Zone
                                </button>
                            </div>
                        </div>

                        {/* Save */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/hibermart-zone-setup")}
                                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || coordinates.length < 3 || !formData.zoneName}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> {isEditMode ? "Update Zone" : "Save Zone"}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Location search */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        ref={autocompleteInputRef}
                                        type="text"
                                        value={locationSearch}
                                        onChange={e => setLocationSearch(e.target.value)}
                                        placeholder="Search location to navigate map..."
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Map */}
                            <div className="relative" style={{ height: '520px' }}>
                                {mapLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3" />
                                        <p className="text-sm text-slate-500">Loading map...</p>
                                    </div>
                                )}
                                <div ref={mapRef} className="w-full h-full" />
                            </div>

                            {/* Map Instructions */}
                            <div className="p-3 bg-orange-50 border-t border-orange-100">
                                <p className="text-xs text-orange-700">
                                    {isDrawing
                                        ? "📍 Click on the map to add zone boundary points. Click the first point to close the polygon."
                                        : coordinates.length >= 3
                                            ? "✅ Zone drawn! Drag a corner to adjust. Click 'Update Zone' / 'Save Zone' when ready."
                                            : "🟠 Click 'Draw Zone' to start drawing the HiberMart delivery boundary polygon on the map."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
