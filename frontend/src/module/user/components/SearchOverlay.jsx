import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { X, Search, Utensils, MapPin, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { restaurantAPI } from "@/lib/api"
import { useDebounce } from "@/lib/hooks/use-debounce" 

export default function SearchOverlay({ isOpen, onClose, searchValue, onSearchChange }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const debouncedSearch = useDebounce(searchValue, 300)
  const [results, setResults] = useState({ restaurants: [], foods: [] })
  const [isLoading, setIsLoading] = useState(false)



  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch.trim()) {
        setResults({ restaurants: [], foods: [] })
        return
      }

      setIsLoading(true)
      try {
        // Fetch both restaurants and foods in parallel
        const [restRes, foodRes] = await Promise.all([
          restaurantAPI.getRestaurants({ search: debouncedSearch, limit: 10 }),
          restaurantAPI.searchFoods(debouncedSearch, 10)
        ])

        setResults({
          restaurants: restRes.data?.success ? restRes.data.data.restaurants : [],
          foods: foodRes.data?.success ? foodRes.data.data.items : []
        })
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedSearch])

  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion)
    inputRef.current?.focus()
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(searchValue.trim())}`)
      onClose()
      onSearchChange("")
    }
  }

  const handleItemClick = (item, type) => {
    if (type === 'restaurant') {
      navigate(`/user/restaurants/${item.slug || item._id}`)
    } else {
      // For food items, go to the restaurant specifically
      navigate(`/user/restaurants/${item.restaurant?.slug || item.restaurant?._id}`)
    }
    onClose()
    onSearchChange("")
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-[#0a0a0a]"
      style={{
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* Header with Search Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-400 z-10" />
              <Input
                ref={inputRef}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search for food, restaurants..."
                className="pl-12 pr-4 h-12 w-full bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-gray-800 focus:border-primary-orange dark:focus:border-primary-orange rounded-full text-lg dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </form>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 scrollbar-hide bg-white dark:bg-[#0a0a0a]">


        {/* Dynamic Results or Featured */}
        <div
          style={{
            animation: 'fadeIn 0.3s ease-out 0.2s both'
          }}
        >
          {searchValue.trim() === "" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-primary-orange" />
              </div>
              <h3 className="text-xl font-bold mb-2">Search for Food</h3>
              <p className="text-gray-500 max-w-xs">Search for your favorite dishes or restaurants to see results here.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Restaurants Section */}
              {results.restaurants.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-orange" />
                    Restaurants
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.restaurants.map((rest) => (
                      <div 
                        key={rest._id} 
                        onClick={() => handleItemClick(rest, 'restaurant')}
                        className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-orange/30 dark:hover:border-primary-orange/30 hover:bg-orange-50/30 dark:hover:bg-orange-900/5 cursor-pointer transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <img 
                            src={rest.profileImage?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'} 
                            className="w-full h-full rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
                            alt={rest.name} 
                          />
                          {rest.rating > 0 && (
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 shadow-sm rounded-lg px-1.5 py-0.5 flex items-center gap-1 border border-gray-100 dark:border-gray-800">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-[10px] font-bold">{rest.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-orange transition-colors">{rest.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {rest.location?.address || rest.location?.formattedAddress || rest.location?.city || 'Location'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="h-3.5 w-3.5 text-primary-orange" />
                            <p className="text-xs font-medium text-primary-orange">{rest.estimatedDeliveryTime || '30-40 min'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dishes Section */}
              {results.foods.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary-orange" />
                    Dishes & Foods
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.foods.map((food, idx) => (
                      <div 
                        key={food.id || idx} 
                        onClick={() => handleItemClick(food, 'food')}
                        className="group flex gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-orange/30 dark:hover:border-primary-orange/30 hover:bg-orange-50/30 dark:hover:bg-orange-900/5 cursor-pointer transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {food.image ? (
                            <img src={food.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Utensils className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2">
                             <p className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-orange transition-colors">{food.name}</p>
                             <p className="font-bold text-primary-orange">₹{food.price}</p>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-1">From: <span className="font-semibold">{food.restaurant?.name}</span></p>
                          <p className="text-[10px] text-gray-400 mt-2 italic">{food.sectionName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.restaurants.length === 0 && results.foods.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No results found</h3>
                  <p className="text-gray-500 max-w-xs">We couldn't find any food or restaurants matching "{searchValue}".</p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-orange/20 border-t-primary-orange mb-4"></div>
                  <p className="text-gray-500 font-medium">Searching for delicacies...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
    </div>
  )
}

