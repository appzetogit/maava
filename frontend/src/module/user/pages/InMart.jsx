import { useState, useCallback, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ShoppingBag,
  Coffee,
  Home,
  Gamepad2,
  Apple,
  Headphones,
  Smartphone,
  Sparkles,
  Shirt,
  ChevronRight,
  Heart,
  Mic,
  Navigation,
  MapPin
} from "lucide-react"
import { Input } from "@/components/ui/input"
import AnimatedPage from "../components/AnimatedPage"
import { useSearchOverlay, useLocationSelector } from "../components/UserLayout"
import { useProfile } from "../context/ProfileContext"
import api from "@/lib/api"
import inmartAPI from "@/lib/api/inmartAPI"
import PageNavbar from "../components/PageNavbar"
import AddToCartButton from "../components/AddToCartButton"
import promoBanner from "@/assets/inmart/promo_banner.png"
import mccainFries from "@/assets/inmart/mccain_fries.png"



const ProductCard = ({ product }) => (
  <div className="flex-shrink-0 w-[145px] sm:w-[175px] md:w-[200px] lg:w-[225px] bg-white dark:bg-[#1a1a1a] rounded-2xl p-2 md:p-3 relative shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:border-white/5 group">
    {/* Discount Badge */}
    <div className="absolute top-0 left-0 z-10">
      <div className="relative">
        <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-11 sm:h-11 drop-shadow-sm">
          <path d="M24 0L27.9 5.7L34.5 4.5L36.3 11.1L42.9 12.9L41.7 19.5L47.4 23.4L41.7 27.3L42.9 33.9L36.3 35.7L34.5 42.3L27.9 41.1L24 46.8L20.1 41.1L13.5 42.3L11.7 35.7L5.1 33.9L6.3 27.3L0.6 23.4L6.3 19.5L5.1 12.9L11.7 11.1L13.5 4.5L20.1 5.7L24 0Z" fill="#8B5CF6" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-[900] leading-none">
          <span className="text-[10px] sm:text-[11px]">{product.discount}</span>
          <span className="text-[8px] sm:text-[9px] uppercase -mt-0.5">OFF</span>
        </div>
      </div>
    </div>

    {/* New Tag */}
    {product.isNew && (
      <div className="absolute top-2 right-2 z-10 bg-[#FF5C5C] text-white text-[9px] sm:text-[10px] md:text-xs font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center justify-center shadow-sm">
        NEW
      </div>
    )}

    {/* Product Image Area */}
    <div className="relative aspect-square w-full mb-2 bg-gray-50/50 dark:bg-white/5 rounded-xl flex items-center justify-center p-1.5 overflow-hidden">
      <img src={product.image} alt={product.name} className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300" />

      {/* Liked Heart Icon - Moved to bottom right of image area */}
      <button className="absolute bottom-1 right-1 p-1 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow-sm border border-gray-100/50 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all">
        <Heart size={14} className="text-[#FF725E] fill-current" />
      </button>
    </div>

    {/* Product Details */}
    <div className="px-1 space-y-0.5">
      <h3 className="text-[13px] sm:text-[14px] font-[700] text-[#101828] dark:text-gray-100 line-clamp-2 break-words leading-[1.2] tracking-tight min-h-[32px] sm:min-h-[36px] overflow-hidden">
        {product.name}
      </h3>
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        {product.weight}
      </p>
    </div>

    {/* Price and Add Button */}
    <div className="mt-2.5 px-1 flex items-center justify-between gap-1.5">
      <div className="flex flex-col leading-none min-w-0">
        <span className={`font-[900] text-gray-900 dark:text-white tracking-tighter ${product.price > 9999 ? 'text-xs' : 'text-sm'}`}>
          ₹{product.price}
        </span>
        {product.originalPrice && (
          <span className="text-[10px] text-gray-400 line-through tracking-tighter decoration-1">
            ₹{product.originalPrice}
          </span>
        )}
      </div>
      <div className="flex-shrink-0">
        <AddToCartButton
          item={{
            ...product,
            restaurant: "Hibermart",
            restaurantId: "hibermart-id"
          }}
          className="w-[50px] sm:w-[55px]"
        />
      </div>
    </div>
  </div>
);

const NewlyLaunchedCard = ({ product }) => (
  <div className="flex-shrink-0 w-[150px] sm:w-[185px] md:w-[210px] bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden relative shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-white/5 group flex flex-col h-full">
    {/* Product Image Area */}
    <div className="relative aspect-square w-full bg-[#F5F5F5] dark:bg-white/5 flex items-center justify-center p-2 overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className="w-[85%] h-[85%] object-contain transform group-hover:scale-110 transition-transform duration-500 ease-out"
      />

      {/* Discount Badge - Top Left */}
      <div className="absolute top-1 left-1 z-10 scale-90 sm:scale-100 origin-top-left">
        <div className="relative">
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
            <path d="M24 0L27.9 5.7L34.5 4.5L36.3 11.1L42.9 12.9L41.7 19.5L47.4 23.4L41.7 27.3L42.9 33.9L36.3 35.7L34.5 42.3L27.9 41.1L24 46.8L20.1 41.1L13.5 42.3L11.7 35.7L5.1 33.9L6.3 27.3L0.6 23.4L6.3 19.5L5.1 12.9L11.7 11.1L13.5 4.5L20.1 5.7L24 0Z" fill="#8B5CF6" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white leading-none">
            <span className="text-[10px] font-black">{product.discount}</span>
            <span className="text-[7px] font-black uppercase">OFF</span>
          </div>
        </div>
      </div>

      {/* New Tag - Top Right */}
      {product.isNew && (
        <div className="absolute top-2 right-2 z-10 bg-[#FF5C5C] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm border border-white/20">
          NEW
        </div>
      )}

      {/* Liked Heart Icon */}
      <button className="absolute bottom-2 right-2 p-1.5 bg-white/90 dark:bg-black/50 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
        <Heart size={14} className="text-[#FF725E] fill-current" />
      </button>
    </div>

    {/* Product Details */}
    <div className="p-3 flex flex-col flex-1">
      <div className="flex-1 space-y-1">
        <h3 className="text-[13px] sm:text-[14px] font-[700] text-[#101828] dark:text-gray-100 line-clamp-2 break-words leading-[1.2] tracking-tight min-h-[32px] sm:min-h-[36px] overflow-hidden">
          {product.name}
        </h3>
        <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
          {product.weight}
        </p>
      </div>

      {/* Price and Add Button */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className={`font-black text-[#101828] dark:text-white leading-none ${product.price > 9999 ? 'text-sm' : 'text-base'}`}>
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-[11px] text-slate-400 line-through font-bold mt-0.5">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          <AddToCartButton
            item={{
              ...product,
              restaurant: "Hibermart",
              restaurantId: "hibermart-id"
            }}
            className="w-[55px] sm:w-[65px]"
          />
        </div>
      </div>
    </div>
  </div>
);

const ProductSection = ({ title, products, onSeeAll, isNewlyLaunched = false, themeColor }) => {
  // Ensure all products have id field mapped from _id
  const productsWithIds = products.map(product => ({
    ...product,
    id: product.id || product._id?.toString() || product._id
  }));

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-white/5 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-7 md:p-8 lg:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50 dark:border-white/5">
        <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10 px-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            onClick={onSeeAll}
            style={{ color: themeColor }}
            className="font-bold text-sm sm:text-base hover:opacity-80 transition-opacity"
          >
            See all
          </button>
        </div>
        <div className="relative">
          <div
            className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-2 px-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {productsWithIds.map((product) => (
              isNewlyLaunched ? (
                <NewlyLaunchedCard key={product.id} product={product} />
              ) : (
                <ProductCard key={product.id} product={product} />
              )
            ))}
            <div className="min-w-[4px] h-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function InMart() {
  const navigate = useNavigate()
  const [heroSearch, setHeroSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  // API Data State
  const [apiData, setApiData] = useState({
    categories: [],
    collections: [],
    banners: [],
    stories: [],
    store: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  // Fetch InMart data from API
  useEffect(() => {
    const fetchInMartData = async () => {
      try {
        setIsLoading(true)
        const response = await inmartAPI.getInMartHome()

        if (response.success) {
          setApiData(response.data)
          console.log('✅ InMart data loaded:', response.data)
        } else {
          console.error('❌ Failed to load InMart data:', response.message)
          setApiError(response.message)
        }
      } catch (error) {
        console.error('❌ Error fetching InMart data:', error)
        setApiError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInMartData()
  }, [])

  const categoriesData = [
    { id: "all", name: "All", icon: ShoppingBag, color: "#8B5CF6", themeColor: "#D3AEFE" },
    { id: "home", name: "Home", icon: Home, color: "#64748B", themeColor: "#BFF7D4" },
    { id: "toys", name: "Toys", icon: Gamepad2, color: "#64748B", themeColor: "#FBE04C" },
    { id: "fresh", name: "Fresh", icon: Apple, color: "#64748B", themeColor: "#21C063" },
    { id: "electronics", name: "Electronics", icon: Headphones, color: "#64748B", themeColor: "#FDE256" },
    { id: "mobiles", name: "Mobiles", icon: Smartphone, color: "#64748B", themeColor: "#FD8930" },
    { id: "beauty", name: "Beauty", icon: Sparkles, color: "#64748B", themeColor: "#FAD0E8" },
    { id: "fashion", name: "Fashion", icon: Shirt, color: "#64748B", themeColor: "#D3AEFE" },
  ]

  const activeCategoryData = useMemo(() =>
    categoriesData.find(cat => cat.name === activeCategory) || categoriesData[0]
    , [activeCategory])

  const [showSplash, setShowSplash] = useState(true)
  const { userProfile, addresses } = useProfile()
  const defaultAddress = addresses?.find(a => a.isDefault) || addresses?.[0] || { addressLine1: "Detecting Location..." }

  useEffect(() => {
    // Hide splash after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])


  // Zepto-style rotating placeholder
  const placeholderItems = useMemo(() => [
    'Search for "Milk"',
    'Search for "Bread"',
    'Search for "Eggs"',
    'Search for "Curd"',
    'Search for "Atta"',
    'Search for "Oil"',
    'Search for "Sugar"',
    'Search for "Tea"',
    'Search for "Coffee"',
  ], [])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderItems.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [placeholderItems.length])

  const { openSearch, closeSearch, setSearchValue } = useSearchOverlay()
  const { openLocationSelector } = useLocationSelector()

  const [inMartHeroBanner, setInMartHeroBanner] = useState(null)

  useEffect(() => {
    const fetchInMartHeroBanner = async () => {
      try {
        const response = await api.get('/hero-banners/dining/public')
        if (response.data.success && response.data.data.banners && response.data.data.banners.length > 0) {
          setInMartHeroBanner(response.data.data.banners[0])
        }
      } catch (error) {
        console.error("Failed to fetch in-mart hero banner", error)
      }
    }
    fetchInMartHeroBanner()
  }, [])


  const handleSearchFocus = useCallback(() => {
    if (heroSearch) {
      setSearchValue(heroSearch)
    }
    openSearch()
  }, [heroSearch, openSearch, setSearchValue])



  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.5, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-[10001] bg-[#8B5CF6] flex flex-col items-center justify-center p-6"
          >
            {/* Top Section: Animated M Logo (Midway between top and middle) */}
            <div className="absolute top-[25%] -translate-y-1/2 flex flex-col items-center">
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                  }}
                  className="relative"
                >
                  {/* Custom SVG for Swiggy-like Pin Shape */}
                  <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                    <path
                      d="M50 0C22.3858 0 0 22.3858 0 50C0 67.4552 9.42149 82.6826 23.5113 91.0776L50 100L76.4887 91.0776C90.5785 82.6826 100 67.4552 100 50C100 22.3858 77.6142 0 50 0Z"
                      fill="white"
                    />
                    <text
                      x="50"
                      y="62"
                      textAnchor="middle"
                      fill="#8B5CF6"
                      fontSize="55"
                      fontWeight="1000"
                      fontStyle="italic"
                      className="select-none"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      M
                    </text>
                  </svg>

                  {/* Glow Effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-white rounded-full blur-3xl -z-10"
                  />
                </motion.div>
              </div>
            </div>

            {/* Middle Section: Branding (Middle of page) */}
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center text-white/90">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-[1000] italic tracking-tightest uppercase"
              >
                Hibermart
              </motion.div>
            </div>

            {/* Bottom Section: Tagline */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              className="absolute bottom-16 flex flex-col items-center"
            >
              <h2 className="text-white text-3xl sm:text-4xl font-[1000] italic tracking-tightest uppercase text-center drop-shadow-lg">
                Freshness at <br />
                <span className="text-white/90">your doorstep</span>
              </h2>
              <div className="flex gap-1.5 mt-6">
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-white/60 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-white/30 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedPage
        className="bg-white dark:bg-[#0a0a0a] scrollbar-hide"
        style={{
          minHeight: '100vh',
          paddingBottom: '80px',
          overflowY: 'auto',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        <style>
          {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
        </style>
        {/* Unified Navbar & Hero Section */}
        <div
          className="relative w-full overflow-hidden lg:min-h-[35vh] md:pt-4 transition-colors duration-500 ease-in-out"
          style={{
            background: `linear-gradient(180deg, ${activeCategoryData.themeColor} 0%, ${activeCategoryData.themeColor}33 100%)`
          }}
        >

          {/* Navbar */}
          <div className="relative z-20 pt-1 sm:pt-3 lg:pt-4">
            <PageNavbar
              textColor="black"
              zIndex={20}
            />
          </div>

          {/* Hero Section with Search */}
          <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 xl:px-12 mt-4 sm:mt-6 md:mt-8 py-4 sm:py-8">
            <div className="max-w-7xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto">
              <div className="relative w-full overflow-hidden">
                <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  {/* Search Input Container */}
                  <div
                    className="relative flex-1 group cursor-pointer"
                    onClick={openSearch}
                  >
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#8B5CF6] transition-colors w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                    <div className="w-full h-12 sm:h-14 md:h-16 bg-white dark:bg-[#1a1a1a] border-2 border-transparent group-hover:border-[#E7D1FF] rounded-2xl sm:rounded-[1.25rem] pl-12 sm:pl-14 pr-12 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all">
                      <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-base md:text-lg font-medium select-none truncate">
                        {placeholderItems[placeholderIndex]}
                      </span>
                    </div>
                    <Mic className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#8B5CF6] transition-colors w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                  </div>

                  {/* Trending Deals Toggle - Hidden on mobile, shown on md+ */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden md:flex flex-shrink-0 h-14 md:h-16 px-6 lg:px-8 rounded-2xl sm:rounded-[1.25rem] bg-white dark:bg-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.04)] items-center gap-3 border-2 border-transparent hover:border-[#FFEDEB] transition-all"
                  >
                    <div className="p-2 bg-[#FFEDEB] dark:bg-[#FFEDEB]/10 rounded-xl">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF725E]" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[#FF725E] font-black text-[10px] lg:text-xs tracking-tighter uppercase italic">Trending</span>
                      <span className="text-[#FF725E] font-black text-sm lg:text-xl tracking-tighter uppercase italic">Deals</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </section>

          {/* Categories Section */}
          <section className="relative z-20 w-full mt-1 sm:mt-2 pb-2 px-0 overflow-hidden">
            <div className="max-w-7xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto">
              <div
                className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-1 px-4 sm:px-6 lg:px-8 xl:px-12"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {categoriesData.map((cat) => {
                  const isActive = activeCategory === cat.name;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.name)}
                      className="flex flex-col items-center gap-1 sm:gap-2 group relative pb-3 px-1 transition-all hover:translate-y-[-2px] min-w-[60px] sm:min-w-[80px]"
                    >
                      <div className={`p-2 sm:p-3 rounded-xl transition-all ${isActive ? 'bg-green-50' : 'group-hover:bg-black/5'}`}>
                        <Icon
                          className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9"
                          color={isActive ? "#16A34A" : "black"}
                          strokeWidth={isActive ? 3 : 2.5}
                        />
                      </div>
                      <span
                        className={`text-[10px] sm:text-sm md:text-base font-bold transition-colors whitespace-nowrap text-center ${isActive ? 'text-green-600 opacity-100' : 'text-black opacity-60 group-hover:opacity-100'}`}
                      >
                        {cat.name}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-full"
                          style={{ width: '100%' }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Banner Section */}
        <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-xl border border-purple-100 dark:border-white/10 bg-[#F3E8FF]"
            >
              <img
                src={promoBanner}
                alt="Zepto Promo Banner"
                className="w-full h-auto object-cover block"
              />
            </motion.div>
          </div>
        </section>

        {/* Special Price Interactive Banner */}
        <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 xl:px-12 mt-4 sm:mt-6 md:mt-8">
          <div className="max-w-7xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                backgroundColor: `${activeCategoryData.themeColor}22`
              }}
              transition={{ duration: 0.5 }}
              className="w-full rounded-xl sm:rounded-2xl md:rounded-[1.5rem] py-3 sm:py-4 md:py-5 px-5 sm:px-8 md:px-10 flex items-center justify-start gap-4 sm:gap-6 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              style={{
                backgroundColor: `${activeCategoryData.themeColor}15`,
                border: `1.5px solid ${activeCategoryData.themeColor}33`
              }}
            >
              {/* Gold Coin Icon */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-inner border-[1.5px] border-yellow-200 group-hover:rotate-12 transition-transform">
                <span className="text-white font-black text-lg sm:text-2xl md:text-3xl drop-shadow-sm">₹</span>
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  className="font-bold text-[12px] sm:text-xl md:text-2xl lg:text-3xl tracking-tighter uppercase leading-tight whitespace-nowrap"
                  style={{ color: activeCategoryData.themeColor }}
                >
                  Special Prices for your 1st order
                </span>
              </div>

              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <ChevronRight
                  size={24}
                  className="md:w-8 md:h-8"
                  strokeWidth={3}
                  style={{ color: `${activeCategoryData.themeColor}66` }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Big Sale Section */}
        <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 xl:px-12 mt-6 sm:mt-10 md:mt-14 pb-10">
          <div className="max-w-7xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] overflow-hidden py-8 sm:py-12 md:py-16 px-4 sm:px-8 md:px-12 shadow-xl border border-purple-100/50 relative transition-colors duration-500 ease-in-out"
              style={{
                background: `linear-gradient(180deg, ${activeCategoryData.themeColor} 0%, ${activeCategoryData.themeColor}dd 100%)`
              }}
            >
              {/* Sunburst Background Effect */}
              <div className="absolute top-[-50px] left-0 right-0 h-[400px] sm:h-[700px] md:h-[900px] overflow-hidden pointer-events-none flex items-center justify-center">
                <div
                  className="w-[1000px] h-[1000px] sm:w-[1600px] sm:h-[1600px] md:w-[2000px] md:h-[2000px] opacity-60 dark:opacity-30 animate-[spin_30s_linear_infinite]"
                  style={{
                    background: `conic-gradient(
                    from 0deg,
                    transparent 0deg, 
                    transparent 5deg, 
                    rgba(255,255,255,0.8) 10deg, 
                    rgba(255,255,255,0.8) 20deg, 
                    transparent 25deg, 
                    transparent 45deg, 
                    rgba(255,255,255,0.8) 50deg, 
                    rgba(255,255,255,0.8) 60deg, 
                    transparent 65deg,
                    transparent 100deg,
                    rgba(255,255,255,0.8) 110deg,
                    rgba(255,255,255,0.8) 120deg,
                    transparent 125deg,
                    transparent 180deg,
                    rgba(255,255,255,0.8) 190deg, 
                    rgba(255,255,255,0.8) 200deg, 
                    transparent 205deg, 
                    transparent 235deg, 
                    rgba(255,255,255,0.8) 240deg, 
                    rgba(255,255,255,0.8) 250deg, 
                    transparent 255deg,
                    transparent 300deg,
                    rgba(255,255,255,0.8) 310deg,
                    rgba(255,255,255,0.8) 320deg,
                    transparent 325deg
                  )`,
                    maskImage: 'radial-gradient(circle, black 25%, transparent 65%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 65%)',
                  }}
                />
              </div>

              {/* Section Header */}
              <div className="relative z-10 flex flex-col items-center mb-6 sm:mb-10 md:mb-14">
                <motion.h2
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-5xl sm:text-8xl md:text-9xl lg:text-[11rem] font-[1000] text-white italic tracking-tighter flex flex-col items-center select-none"
                  style={{
                    WebkitTextStroke: '2px black',
                    textShadow: `
                    1px 1px 0px #000,
                    2px 2px 0px #000,
                    3px 3px 0px #000,
                    4px 4px 0px #000,
                    5px 5px 0px #000,
                    6px 6px 0px #000,
                    7px 7px 0px #000,
                    8px 8px 15px rgba(0,0,0,0.4)
                  `
                  }}
                >
                  BIG SALE
                </motion.h2>
              </div>

              {/* Product Carousel */}
              <div className="relative mb-6 sm:mb-10 md:mb-14">
                <div
                  className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-4 px-1"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {(apiData.collections?.find(c => c.slug === 'sale')?.products || []).map((product) => {
                    // Ensure product has id field mapped from _id
                    const productWithId = {
                      ...product,
                      id: product.id || product._id?.toString() || product._id
                    };
                    return <ProductCard key={productWithId.id} product={productWithId} />;
                  })}
                  <div className="min-w-[4px] h-full"></div>
                </div>
              </div>

              {/* See All Button */}
              <div className="mt-0 px-2 sm:px-4 md:px-8 lg:px-12">
                <motion.button
                  whileHover={{
                    scale: 1.01,
                    y: -2,
                    background: `linear-gradient(180deg, #ffffff 0%, ${activeCategoryData.themeColor}22 100%)`
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { }}
                  className="w-full max-w-2xl mx-auto text-gray-900 dark:text-white font-bold py-4 sm:py-5 md:py-6 rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 text-base sm:text-xl lg:text-2xl transition-all shadow-md border border-black/10"
                  style={{
                    background: `linear-gradient(180deg, #ffffff 0%, ${activeCategoryData.themeColor}11 100%)`
                  }}
                >
                  See all
                  <ChevronRight size={24} className="stroke-[4px]" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-2 sm:pt-4 md:pt-6 lg:pt-8 pb-10">
          <ProductSection
            title="Newly Launched"
            products={apiData.collections?.find(c => c.slug === 'newly-launched')?.products || []}
            onSeeAll={() => { }}
            isNewlyLaunched={true}
            themeColor={activeCategoryData.themeColor}
          />

          <ProductSection
            title="Best Sellers"
            products={apiData.collections?.find(c => c.slug === 'best-sellers')?.products || []}
            onSeeAll={() => { }}
            themeColor={activeCategoryData.themeColor}
          />

          {/* Dynamic Category Sections */}
          {!isLoading && apiData.categories && apiData.categories.map((category) => (
            <section key={category._id || category.slug} className="mb-12">
              <div className="bg-white dark:bg-white/5 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-7 md:p-8 lg:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100/50 dark:border-white/5">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 px-1">
                  {category.name}
                </h2>
                <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
                  {(category.subCategories || []).map((subCat) => (
                    <Link key={subCat.id || subCat.slug} to={`/in-mart/products/${subCat.slug || subCat.id}`}>
                      <motion.div
                        whileHover={{ y: -3 }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <div className="w-full aspect-square bg-[#F5F9FF] dark:bg-white/5 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden p-0 flex items-center justify-center transition-all group-hover:shadow-sm">
                          <img
                            src={subCat.image || "https://via.placeholder.com/200"}
                            alt={subCat.name}
                            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                            style={{ background: 'transparent' }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-800 dark:text-gray-200 text-center leading-tight pt-1 px-1">
                          {subCat.name}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ))}


          {/* Trending Near You Section */}
          <ProductSection
            title="Trending Near You"
            products={apiData.collections?.find(c => c.slug === 'trending')?.products || []}
            onSeeAll={() => { }}
            themeColor={activeCategoryData.themeColor}
          />

          {/* Hibermart Branding Section */}
          <section className="mt-12 mb-8 py-12 sm:py-16 md:py-20 flex flex-col items-center bg-gray-50/40 dark:bg-white/5 border-t border-b border-gray-100/50 dark:border-white/5 select-none">
            <h2 className="text-[56px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black tracking-tighter leading-none italic bg-clip-text text-transparent bg-gradient-to-r from-[#16A34A] via-[#15803D] to-[#166534]">
              hibermart
            </h2>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-4">
              Freshness at your doorstep
            </p>
          </section>
        </div>
      </AnimatedPage>
    </>
  )
}
