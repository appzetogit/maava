import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Lenis from "lenis"
import { ArrowLeft, ChevronDown } from "lucide-react"
import BottomPopup from "@/module/delivery/components/BottomPopup"
import { restaurantAPI } from "@/lib/api"

const ADDRESS_STORAGE_KEY = "restaurant_address"

// Default coordinates for Indore (can be updated based on actual location)
const DEFAULT_LAT = 22.7196
const DEFAULT_LNG = 75.8577

export default function EditRestaurantAddress() {
  const navigate = useNavigate()
  const [address, setAddress] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSelectOptionDialog, setShowSelectOptionDialog] = useState(false)
  const [selectedOption, setSelectedOption] = useState("minor_correction") // "update_address" or "minor_correction"
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  // Format address consistently with RestaurantDetails.jsx
  const formatAddress = (locationObj) => {
    if (!locationObj) return "Location"

    // If location is a string, return it as is
    if (typeof locationObj === 'string') {
      return locationObj
    }

    // PRIORITY 1: Use formattedAddress if it's complete
    if (locationObj.formattedAddress && locationObj.formattedAddress.trim() !== "" && locationObj.formattedAddress !== "Select location") {
      const isCoordinates = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(locationObj.formattedAddress.trim())
      if (!isCoordinates) {
        const cleanedAddr = locationObj.formattedAddress.trim().replace(/^[A-Z0-9]+\+[A-Z0-9]+,\s*/i, '')
        if (cleanedAddr.length > 5) {
          return cleanedAddr
        }
      }
    }

    // PRIORITY 2: Build address from location object components
    const addressParts = []
    if (locationObj.addressLine1 && locationObj.addressLine1.trim() !== "") {
      addressParts.push(locationObj.addressLine1.trim())
    }
    if (locationObj.addressLine2 && locationObj.addressLine2.trim() !== "") {
      addressParts.push(locationObj.addressLine2.trim())
    }
    if (locationObj.area && locationObj.area.trim() !== "") {
      addressParts.push(locationObj.area.trim())
    }
    if (locationObj.city && locationObj.city.trim() !== "") {
      addressParts.push(locationObj.city.trim())
    }
    const pinCode = locationObj.pincode || locationObj.zipCode || locationObj.postalCode
    if (pinCode && pinCode.toString().trim() !== "") {
      addressParts.push(pinCode.toString().trim())
    }

    if (addressParts.length >= 1) {
      return addressParts.join(', ')
    }

    // PRIORITY 3: Fallback to formattedAddress
    if (locationObj.formattedAddress && locationObj.formattedAddress.trim() !== "") {
      return locationObj.formattedAddress.trim()
    }

    return locationObj.address || "Location"
  }

  // Fetch restaurant data from backend
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        const data = response?.data?.data?.restaurant || response?.data?.restaurant
        if (data) {
          setRestaurantName(data.name || "")
          if (data.location) {
            setLocation(data.location)
            const formatted = formatAddress(data.location)
            setAddress(formatted)
            // Set coordinates if available
            if (data.location.latitude && data.location.longitude) {
              setLat(data.location.latitude)
              setLng(data.location.longitude)
            }
          } else {
            // Fallback to localStorage
            try {
              const savedAddress = localStorage.getItem(ADDRESS_STORAGE_KEY)
              if (savedAddress) {
                setAddress(savedAddress)
              }
            } catch (error) {
              console.error("Error loading address from storage:", error)
            }
          }
        }
      } catch (error) {
        // Only log error if it's not a network/timeout error (backend might be down/slow)
        if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNABORTED' && !error.message?.includes('timeout')) {
          console.error("Error fetching restaurant data:", error)
        }
        // Fallback to localStorage
        try {
          const savedAddress = localStorage.getItem(ADDRESS_STORAGE_KEY)
          if (savedAddress) {
            setAddress(savedAddress)
          }
          // Try to get restaurant name from localStorage, but prefer empty string over hardcoded value
          const savedName = localStorage.getItem("restaurant_name") || 
                           localStorage.getItem("restaurantName") ||
                           ""
          setRestaurantName(savedName)
        } catch (e) {
          console.error("Error loading from localStorage:", e)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()

    // Listen for address updates
    const handleAddressUpdate = () => {
      fetchRestaurantData()
    }

    window.addEventListener("addressUpdated", handleAddressUpdate)
    return () => window.removeEventListener("addressUpdated", handleAddressUpdate)
  }, [])

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Handle opening Google Maps app
  const handleViewOnMap = () => {
    // Create Google Maps URL for the restaurant location
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    
    // Try to open in Google Maps app (mobile) or web
    window.open(googleMapsUrl, "_blank")
  }

  // Handle Update button click
  const handleUpdateClick = () => {
    setShowSelectOptionDialog(true)
  }

  // Handle Proceed to update
  const handleProceedUpdate = async () => {
    try {
      // For now, we'll update the location in the database
      // In a real scenario, you might want to handle FSSAI update flow separately
      if (selectedOption === "update_address") {
        // For major address update, you might want to navigate to a form
        // For now, we'll just show a message
        alert("For major address updates, FSSAI verification may be required. Please contact support.")
        setShowSelectOptionDialog(false)
        return
      } else {
        // Minor correction - update location coordinates
        // Fetch live address from coordinates using Google Maps API
          // Get Google Maps API key
          const { getGoogleMapsApiKey } = await import('@/lib/utils/googleMapsApiKey.js')
          const GOOGLE_MAPS_API_KEY = await getGoogleMapsApiKey()
          
          let formattedAddress = location?.formattedAddress || ""
          
          // Fetch formattedAddress from coordinates if API key available
          if (GOOGLE_MAPS_API_KEY && lat && lng) {
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=en&region=in&result_type=street_address|premise|point_of_interest|establishment`
              )
              const data = await response.json()
              
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                formattedAddress = data.results[0].formatted_address
                console.log("✅ Fetched formattedAddress from coordinates:", formattedAddress)
              }
            } catch (error) {
              console.warn("⚠️ Failed to fetch formattedAddress, using existing:", error)
            }
          }
          
          // Update location with coordinates array and formattedAddress
          const updatedLocation = {
            ...location,
            latitude: lat,
            longitude: lng,
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            formattedAddress: formattedAddress || location?.formattedAddress || ""
          }
          
          const response = await restaurantAPI.updateProfile({ location: updatedLocation })
          
          if (response?.data?.data?.restaurant) {
            // Update local state
            setLocation(updatedLocation)
            // Dispatch event to notify other components
            window.dispatchEvent(new Event("addressUpdated"))
            setShowSelectOptionDialog(false)
            navigate(-1)
          } else {
            throw new Error("Invalid response from server")
        }
      }
    } catch (error) {
      console.error("Error updating address:", error)
      alert(`Failed to update address: ${error.response?.data?.message || error.message || "Please try again."}`)
    }
  }

  // Handle address search using Nominatim
  const handleSearch = async (query) => {
    if (!query || query.length < 3) return
    
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`)
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle selecting a search result
  const handleSelectLocation = (result) => {
    const newLat = parseFloat(result.lat)
    const newLng = parseFloat(result.lon)
    setLat(newLat)
    setLng(newLng)
    setAddress(result.display_name)
    setSearchResults([])
    setSearchQuery("")
    
    // Update temporary location object
    setLocation(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLng,
      formattedAddress: result.display_name,
      coordinates: [newLng, newLat]
    }))
  }

  // Get simplified address for navbar (last two parts: area, city)
  const getSimplifiedAddress = (fullAddress) => {
    const parts = fullAddress.split(",").map(p => p.trim())
    if (parts.length >= 2) {
      // Return last two parts (e.g., "By Pass Road (South), Indore")
      return parts.slice(-2).join(", ")
    }
    return fullAddress
  }
  
  const simplifiedAddress = getSimplifiedAddress(address)

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h1 className="text-base font-bold text-gray-900 truncate">{restaurantName}</h1>
            <ChevronDown className="w-4 h-4 text-gray-900 shrink-0" />
          </div>
          <p className="text-xs text-gray-600 truncate">{simplifiedAddress}</p>
        </div>
      </div>

      {/* Map Section - Takes remaining space */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Google Maps Embed */}
        <iframe
          src={`https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
        
        {/* Custom Marker Tooltip Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          {/* Tooltip */}
          <div className="bg-black text-white px-3 py-2 rounded-lg mb-2 whitespace-nowrap shadow-lg">
            <p className="text-xs font-semibold">Your outlet location</p>
            <p className="text-[10px] text-gray-300">Orders will be picked up from here</p>
          </div>
          {/* Marker Pin */}
          <div className="w-6 h-6 bg-black rounded-full border-2 border-white shadow-lg mx-auto"></div>
        </div>

        {/* Address Details Section - Overlays map at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-20 px-4 pt-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-3">Outlet address</h2>
          
          {/* Informational Banner */}
          <div className="bg-blue-100 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-gray-900">
              Customers and Maava delivery partners will use this to locate your outlet.
            </p>
          </div>

          {/* Address Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Search for your outlet area..."
              />
              {isSearching && (
                <div className="absolute right-3 top-3.5">
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl z-30 mt-1 max-h-60 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{result.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Address Display */}
          <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Current Pinned Address</p>
            <p className="text-sm text-gray-900">{address}</p>
          </div>

          {/* Update Button */}
          <div className="pb-4">
            <button
              onClick={handleUpdateClick}
              className="w-full bg-black text-white font-semibold py-4 text-base rounded-lg"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Select Option Bottom Popup */}
      <BottomPopup
        isOpen={showSelectOptionDialog}
        onClose={() => setShowSelectOptionDialog(false)}
        title="Select an option"
        maxHeight="auto"
      >
        <div className=" space-y-0">
          {/* Option 1: Update outlet address */}
          <button
            onClick={() => setSelectedOption("update_address")}
            className="w-full flex items-start justify-between py-4 border-b border-dashed border-gray-300"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Update outlet address (FSSAI required)
              </p>
              <p className="text-sm text-gray-500">{address}</p>
            </div>
            <div className="ml-4 shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "update_address"
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {selectedOption === "update_address" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </button>

          {/* Option 2: Minor correction */}
          <button
            onClick={() => setSelectedOption("minor_correction")}
            className="w-full flex items-start justify-between py-4"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Make a minor correction to the location pin
              </p>
              <p className="text-sm text-gray-500">
                If location pin on the map is slightly misplaced
              </p>
            </div>
            <div className="ml-4 shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "minor_correction"
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {selectedOption === "minor_correction" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </button>

          {/* Proceed Button */}
          <button
            onClick={handleProceedUpdate}
            className="w-full bg-black text-white font-semibold py-4 rounded-lg mt-6"
          >
            Proceed to update
          </button>
        </div>
      </BottomPopup>
    </div>
  )
}
