import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Building2, Info, Tag, Upload, Calendar, FileText, MapPin, CheckCircle2, X, Image as ImageIcon, Clock, Loader2, Search, Navigation } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { adminAPI, uploadAPI } from "@/lib/api"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from "sonner"

const cuisinesOptions = [
    "North Indian",
    "South Indian",
    "Chinese",
    "Pizza",
    "Burgers",
    "Bakery",
    "Cafe",
]

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Map Events component
function LocationPickerMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
        },
    })

    return position ? (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    setPosition(e.target.getLatLng())
                },
            }}
        />
    ) : null
}

function MapUpdater({ center }) {
    const map = useMap()
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, map.getZoom())
        }
    }, [center, map])
    return null
}

function MapBoundsFitter({ zones, hasRestaurantLocation }) {
    const map = useMap()
    useEffect(() => {
        if (!hasRestaurantLocation && zones && zones.length > 0) {
            const bounds = L.latLngBounds()
            zones.forEach(zone => {
                zone.coordinates.forEach(coord => {
                    bounds.extend([coord.latitude || coord.lat, coord.longitude || coord.lng])
                })
            })
            map.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [zones, hasRestaurantLocation, map])
    return null
}

export default function EditRestaurant() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [formErrors, setFormErrors] = useState({})
    const [zones, setZones] = useState([])


    // Step 1: Basic Info
    const [step1, setStep1] = useState({
        restaurantName: "",
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        primaryContactNumber: "",
        location: {
            addressLine1: "",
            addressLine2: "",
            area: "",
            city: "",
            state: "",
            pincode: "",
            landmark: "",
            latitude: 20.5937,
            longitude: 78.9629,
        },
    })

    // Step 2: Images & Operational
    const [step2, setStep2] = useState({
        menuImages: [],
        profileImage: null,
        cuisines: [],
        openingTime: "09:00",
        closingTime: "22:00",
        openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    })

    // Step 3: Documents
    const [step3, setStep3] = useState({
        panNumber: "",
        nameOnPan: "",
        panImage: null,
        gstRegistered: false,
        gstNumber: "",
        gstLegalName: "",
        gstAddress: "",
        gstImage: null,
        fssaiNumber: "",
        fssaiExpiry: "",
        fssaiImage: null,
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        accountType: "",
    })

    // Step 4: Display Info
    const [step4, setStep4] = useState({
        estimatedDeliveryTime: "25-30 mins",
        featuredDish: "",
        featuredPrice: "249",
        offer: "",
        rating: 0,
        totalRatings: 0,
    })

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                setIsLoading(true)
                const response = await adminAPI.getRestaurantById(id)
                if (response.data.success) {
                    const res = response.data.data
                    setStep1({
                        restaurantName: res.name || "",
                        ownerName: res.ownerName || "",
                        ownerEmail: res.ownerEmail || "",
                        ownerPhone: res.ownerPhone || "",
                        primaryContactNumber: res.primaryContactNumber || "",
                        location: {
                            addressLine1: res.location?.addressLine1 || "",
                            addressLine2: res.location?.addressLine2 || "",
                            area: res.location?.area || "",
                            city: res.location?.city || "",
                            state: res.location?.state || "",
                            pincode: res.location?.pincode || "",
                            landmark: res.location?.landmark || "",
                            latitude: res.location?.latitude || 20.5937,
                            longitude: res.location?.longitude || 78.9629,
                        }
                    })
                    setStep2({
                        menuImages: res.menuImages || [],
                        profileImage: res.profileImage || null,
                        cuisines: res.cuisines || [],
                        openingTime: res.deliveryTimings?.openingTime || "09:00",
                        closingTime: res.deliveryTimings?.closingTime || "22:00",
                        openDays: res.openDays || [],
                    })
                    setStep4({
                        estimatedDeliveryTime: res.estimatedDeliveryTime || "25-30 mins",
                        featuredDish: res.featuredDish || "",
                        featuredPrice: res.featuredPrice || "249",
                        offer: res.offer || "",
                        rating: res.rating || 0,
                        totalRatings: res.totalRatings || 0,
                    })
                }
            } catch (error) {
                toast.error("Failed to fetch restaurant details")
                navigate("/admin/restaurants")
            } finally {
                setIsLoading(false)
            }
        }
        
        const fetchZones = async () => {
            try {
                const response = await adminAPI.getZones({ restaurantId: id })
                if (response.data.success) {
                    setZones(response.data.data.zones)
                }
            } catch (error) {
                console.error("Error fetching zones:", error)
            }
        }

        if (id) {
            fetchRestaurant()
            fetchZones()
        }
    }, [id, navigate])

    const handleUpload = async (file, folder) => {
        try {
            const res = await uploadAPI.uploadMedia(file, { folder })
            const d = res?.data?.data || res?.data
            return { url: d.url, publicId: d.publicId }
        } catch (err) {
            console.error("Upload error", err)
            throw err
        }
    }

    const validateStep1 = () => {
        const errors = []
        if (!step1.restaurantName?.trim()) errors.push("Restaurant name is required")
        if (!step1.ownerName?.trim()) errors.push("Owner name is required")
        if (!step1.location?.area?.trim()) errors.push("Area is required")
        if (!step1.location?.city?.trim()) errors.push("City is required")
        return errors
    }

    const handleNext = () => {
        if (step === 1) {
            const errors = validateStep1()
            if (errors.length > 0) {
                errors.forEach(e => toast.error(e))
                return
            }
        }
        if (step < 4) setStep(step + 1)
        else handleSubmit()
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Process images (only upload if NEW file)
            let profileImageData = step2.profileImage
            if (step2.profileImage instanceof File) {
                profileImageData = await handleUpload(step2.profileImage, "appzeto/restaurant/profile")
            }

            let menuImagesData = []
            for (const img of step2.menuImages) {
                if (img instanceof File) {
                    const uploaded = await handleUpload(img, "appzeto/restaurant/menu")
                    menuImagesData.push(uploaded)
                } else {
                    menuImagesData.push(img)
                }
            }

            const payload = {
                name: step1.restaurantName,
                ownerName: step1.ownerName,
                ownerEmail: step1.ownerEmail,
                ownerPhone: step1.ownerPhone,
                primaryContactNumber: step1.primaryContactNumber,
                location: step1.location,
                menuImages: menuImagesData,
                profileImage: profileImageData,
                cuisines: step2.cuisines,
                deliveryTimings: {
                    openingTime: step2.openingTime,
                    closingTime: step2.closingTime
                },
                openDays: step2.openDays,
                estimatedDeliveryTime: step4.estimatedDeliveryTime,
                featuredDish: step4.featuredDish,
                featuredPrice: parseFloat(step4.featuredPrice),
                offer: step4.offer,
                rating: parseFloat(step4.rating),
                totalRatings: parseInt(step4.totalRatings)
            }

            const response = await adminAPI.updateRestaurant(id, payload)
            if (response.data.success) {
                toast.success("Restaurant updated successfully")
                setShowSuccessDialog(true)
                setTimeout(() => navigate("/admin/restaurants"), 2000)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update restaurant")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="px-4 py-4 sm:px-6 sm:py-5 bg-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div className="text-sm font-semibold text-black">Edit Restaurant: {step1.restaurantName}</div>
                </div>
                <div className="text-xs text-gray-600">Step {step} of 4</div>
            </header>

            <main className="flex-1 px-4 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto w-full">
                {step === 1 && (
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Restaurant Name*</Label>
                                    <Input value={step1.restaurantName} onChange={e => setStep1({ ...step1, restaurantName: e.target.value })} className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Owner Name*</Label>
                                    <Input value={step1.ownerName} onChange={e => setStep1({ ...step1, ownerName: e.target.value })} className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all" />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Location & Map Pin</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Area / Locality*</Label>
                                    <Input value={step1.location.area} onChange={e => setStep1({ ...step1, location: { ...step1.location, area: e.target.value } })} className="bg-gray-50/50 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">City*</Label>
                                    <Input value={step1.location.city} onChange={e => setStep1({ ...step1, location: { ...step1.location, city: e.target.value } })} className="bg-gray-50/50 border-gray-200" />
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-blue-600" />
                                    Pin Restaurant on Map
                                </Label>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Search for location..."
                                            className="pl-9 bg-gray-50 border-gray-200"
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(e.target.value)}&countrycodes=in`)
                                                    const data = await res.json()
                                                    if (data?.[0]) {
                                                        setStep1(prev => ({
                                                            ...prev,
                                                            location: { ...prev.location, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
                                                        }))
                                                    }
                                                }
                                            }}
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <Button variant="outline" onClick={() => {
                                        navigator.geolocation.getCurrentPosition(p => setStep1(prev => ({
                                            ...prev,
                                            location: { ...prev.location, latitude: p.coords.latitude, longitude: p.coords.longitude }
                                        })))
                                    }}><MapPin className="w-4 h-4" /></Button>
                                </div>

                                <div className="h-[350px] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                    <MapContainer
                                        center={[step1.location.latitude, step1.location.longitude]}
                                        zoom={15}
                                        style={{ height: '350px', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <MapUpdater center={[step1.location.latitude, step1.location.longitude]} />
                                        <LocationPickerMarker
                                            position={{ lat: step1.location.latitude, lng: step1.location.longitude }}
                                            setPosition={l => setStep1(prev => ({ ...prev, location: { ...prev.location, latitude: l.lat, longitude: l.lng } }))}
                                        />
                                        <MapBoundsFitter zones={zones} hasRestaurantLocation={step1.location.latitude !== 20.5937} />
                                        {zones.map(zone => (
                                            <Polygon
                                                key={zone._id}
                                                positions={zone.coordinates.map(c => [c.latitude || c.lat, c.longitude || c.lng])}
                                                pathOptions={{ 
                                                    color: '#9333ea', 
                                                    fillColor: '#9333ea', 
                                                    fillOpacity: 0.1,
                                                    dashArray: '5, 5'
                                                }}
                                            >
                                                <Tooltip sticky>
                                                    <div className="font-bold text-purple-700">{zone.name || zone.zoneName}</div>
                                                    <div className="text-xs text-gray-600">{zone.serviceLocation}</div>
                                                </Tooltip>
                                            </Polygon>
                                        ))}
                                    </MapContainer>
                                </div>
                                <div className="flex gap-4 text-xs font-mono text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span>LAT: {step1.location.latitude.toFixed(6)}</span>
                                    <span>LNG: {step1.location.longitude.toFixed(6)}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Visuals & Cuisine</h2>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Profile Image</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                            {step2.profileImage ? (
                                                <img
                                                    src={typeof step2.profileImage === 'string' ? step2.profileImage : (step2.profileImage.url || URL.createObjectURL(step2.profileImage))}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <Input type="file" accept="image/*" onChange={e => setStep2({ ...step2, profileImage: e.target.files[0] })} className="text-xs" />
                                            <p className="text-[10px] text-gray-400 mt-1">Recommended: Square image, max 2MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Cuisines (Select up to 3)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {cuisinesOptions.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => {
                                                    const exists = step2.cuisines.includes(c)
                                                    if (exists) setStep2({ ...step2, cuisines: step2.cuisines.filter(x => x !== c) })
                                                    else if (step2.cuisines.length < 3) setStep2({ ...step2, cuisines: [...step2.cuisines, c] })
                                                }}
                                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${step2.cuisines.includes(c) ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Opening Time</Label>
                                        <Input type="time" value={step2.openingTime} onChange={e => setStep2({ ...step2, openingTime: e.target.value })} className="bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Closing Time</Label>
                                        <Input type="time" value={step2.closingTime} onChange={e => setStep2({ ...step2, closingTime: e.target.value })} className="bg-gray-50/50" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Contact & Operations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Owner Phone</Label>
                                    <Input value={step1.ownerPhone} onChange={e => setStep1({ ...step1, ownerPhone: e.target.value })} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Primary Contact</Label>
                                    <Input value={step1.primaryContactNumber} onChange={e => setStep1({ ...step1, primaryContactNumber: e.target.value })} className="bg-gray-50/50" />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Operational Days</h2>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            const exists = step2.openDays.includes(day)
                                            if (exists) setStep2({ ...step2, openDays: step2.openDays.filter(d => d !== day) })
                                            else setStep2({ ...step2, openDays: [...step2.openDays, day] })
                                        }}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${step2.openDays.includes(day) ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Display Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Est. Delivery Time</Label>
                                    <Input value={step4.estimatedDeliveryTime} onChange={e => setStep4({ ...step4, estimatedDeliveryTime: e.target.value })} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Featured Dish</Label>
                                    <Input value={step4.featuredDish} onChange={e => setStep4({ ...step4, featuredDish: e.target.value })} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Featured Price (₹)</Label>
                                    <Input type="number" value={step4.featuredPrice} onChange={e => setStep4({ ...step4, featuredPrice: e.target.value })} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Offer Text</Label>
                                    <Input placeholder="e.g. 20% OFF up to ₹100" value={step4.offer} onChange={e => setStep4({ ...step4, offer: e.target.value })} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Rating (0-5)</Label>
                                    <Input type="number" step="0.1" min="0" max="5" value={step4.rating} onChange={e => setStep4({ ...step4, rating: e.target.value })} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total Ratings Count</Label>
                                    <Input type="number" min="0" value={step4.totalRatings} onChange={e => setStep4({ ...step4, totalRatings: e.target.value })} className="bg-gray-50/50" />
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>

            <footer className="px-6 py-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                <div className="max-w-4xl mx-auto flex justify-between">
                    <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Button>
                    <Button onClick={handleNext} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : step === 4 ? "Update Restaurant" : "Continue"}
                    </Button>
                </div>
            </footer>
        </div>
    )
}
