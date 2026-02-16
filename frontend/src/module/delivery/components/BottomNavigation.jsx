import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Rss, Wallet, History } from "lucide-react"
import { deliveryAPI } from "@/lib/api"

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profileImage, setProfileImage] = useState(null)
  const [imageError, setImageError] = useState(false)

  const isActive = (path) => {
    if (path === "/delivery") return location.pathname === "/delivery"
    return location.pathname.startsWith(path)
  }

  const TabIcon = (active, Icon) => {
    return <Icon className={`w-6 h-6 transition-colors duration-300 ${active ? "text-black stroke-[2.5]" : "text-gray-400 stroke-[2]"}`} />
  }

  const TabLabel = (active, label) => (
    <span className={`text-[10px] font-bold transition-colors duration-300 ${active ? "text-black" : "text-gray-500"}`}>
      {label}
    </span>
  )

  // Fetch profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await deliveryAPI.getProfile()
        if (response?.data?.success && response?.data?.data?.profile) {
          const profile = response.data.data.profile
          // Use profileImage.url first, fallback to documents.photo
          const imageUrl = profile.profileImage?.url || profile.documents?.photo
          if (imageUrl) {
            setProfileImage(imageUrl)
          }
        }
      } catch (error) {
        // Skip logging network and timeout errors (handled by axios interceptor)
        if (error.code !== 'ECONNABORTED' &&
          error.code !== 'ERR_NETWORK' &&
          error.message !== 'Network Error' &&
          !error.message?.includes('timeout')) {
          console.error("Error fetching profile image for navigation:", error)
        }
      }
    }

    fetchProfileImage()

    // Listen for profile refresh events
    const handleProfileRefresh = () => {
      fetchProfileImage()
    }

    window.addEventListener('deliveryProfileRefresh', handleProfileRefresh)

    return () => {
      window.removeEventListener('deliveryProfileRefresh', handleProfileRefresh)
    }
  }, [])

  const navItems = [
    { id: 'feed', path: "/delivery", label: "Feed", icon: Rss },
    { id: 'pocket', path: "/delivery/requests", label: "Pocket", icon: Wallet },
    { id: 'history', path: "/delivery/trip-history", label: "History", icon: History },
    { id: 'profile', path: "/delivery/profile", label: "Profile", icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4">
      <div className="bg-black/90 backdrop-blur-lg border border-white/10 rounded-full py-2 px-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around relative">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-4 py-2 relative group flex-1"
              >
                {/* Active Pill Background */}
                {active && (
                  <motion.div
                    layoutId="deliveryBottomNavActive"
                    className="absolute inset-0 bg-white rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35
                    }}
                  />
                )}

                {item.id === 'profile' ? (
                  <div className="relative">
                    {profileImage && !imageError ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className={`w-5 h-5 rounded-full border-2 object-cover transition-all duration-300 ${active ? "border-black scale-110" : "border-white/20"
                          }`}
                        onError={() => {
                          setImageError(true)
                        }}
                      />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-gray-800 transition-all duration-300 ${active ? "border-black scale-110" : "border-white/20"
                        }`}>
                        <User className={`w-3 h-3 ${active ? "text-black" : "text-gray-400"}`} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105 active:scale-95"}`}>
                    <item.icon className={`w-5 h-5 transition-colors duration-300 ${active ? "text-black stroke-[2.5]" : "text-gray-400 stroke-[2]"}`} />
                  </div>
                )}
                <span className={`text-[11px] font-bold transition-colors duration-300 ${active ? "text-black" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
