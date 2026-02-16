import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown } from "lucide-react"
import AnimatedPage from "./AnimatedPage"
import { Button } from "@/components/ui/button"
import AddToCartButton from "./AddToCartButton"

const scrollbarStyles = `
  .custom-vertical-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-vertical-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-vertical-scrollbar::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
  }
  .custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

export default function ProductCategoryView({
    title,
    sidebarCategories = [],
    products = [],
    activeCategory: initialCategory,
    onCategoryChange
}) {
    const navigate = useNavigate()
    const [activeCategory, setActiveCategory] = useState(initialCategory || (sidebarCategories[0]?.name))

    const handleCategoryClick = (catName) => {
        setActiveCategory(catName)
        if (onCategoryChange) onCategoryChange(catName)
    }

    return (
        <AnimatedPage className="bg-white" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
            <style>{scrollbarStyles}</style>

            {/* Top Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-4 h-14 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-1 flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                    </button>
                    <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight truncate">{title}</h1>
                </div>
                <button className="p-1 flex-shrink-0">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                </button>
            </header>

            <div className="flex w-full min-h-[calc(100vh-56px)]">
                {/* Left Sidebar */}
                <aside className="w-[85px] sm:w-[110px] flex-shrink-0 border-r border-gray-100 bg-[#F9F9F9] sticky top-14 h-[calc(100vh-56px)] overflow-y-auto custom-vertical-scrollbar z-40 pb-20">
                    {sidebarCategories.map((cat) => {
                        const isActive = activeCategory === cat.name;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.name)}
                                className={`flex flex-col items-center py-3 sm:py-4 px-1 w-full transition-all relative group ${isActive ? 'bg-white' : 'hover:bg-gray-50'}`}
                            >
                                <div className={`w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[16px] sm:rounded-[20px] overflow-hidden mb-1.5 sm:mb-2 flex items-center justify-center transition-all ${isActive ? 'ring-[2.5px] ring-[#101828] scale-100 shadow-sm bg-white p-0.5' : 'bg-[#EBF4FF] opacity-80 group-hover:opacity-100'}`}>
                                    <div className={`w-full h-full rounded-[14px] sm:rounded-[18px] overflow-hidden flex items-center justify-center ${isActive ? 'bg-white' : 'bg-transparent'}`}>
                                        <img
                                            src={cat.icon}
                                            alt={cat.name}
                                            className="w-[85%] h-[85%] object-contain"
                                        />
                                    </div>
                                </div>
                                <span className={`text-[9px] sm:text-[11px] leading-tight font-bold text-center px-1 break-words max-w-[75px] sm:max-w-[95px] transition-colors ${isActive ? 'text-[#101828]' : 'text-slate-500 font-semibold'}`}>
                                    {cat.name}
                                </span>
                            </button>
                        );
                    })}
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-white min-w-0">
                    {/* Quick Filters */}
                    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md py-3 px-3 sm:px-4 flex flex-col gap-3 border-b border-gray-100 shadow-sm/5">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                            <Button variant="outline" className="rounded-xl h-8 px-3 border-gray-200 text-[10px] sm:text-xs font-bold gap-1.5 flex-shrink-0 bg-white shadow-sm hover:bg-gray-50">
                                Filters <SlidersHorizontal size={12} strokeWidth={3} />
                            </Button>
                            <Button variant="outline" className="rounded-xl h-8 px-4 border-gray-200 text-[10px] sm:text-xs font-bold flex-shrink-0 bg-white shadow-sm hover:bg-gray-50">
                                Gourmet
                            </Button>
                            <div className="h-4 w-px bg-gray-200 mx-1 flex-shrink-0" />
                            <Button variant="outline" className="rounded-xl h-8 px-3 border-gray-200 text-[10px] sm:text-xs font-bold gap-1.5 flex-shrink-0 bg-white shadow-sm hover:bg-gray-50">
                                Sort By <ChevronDown size={12} strokeWidth={3} />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                            {["All", "Popular", "Organic", "New Arrivals", "Best Sellers"].map((filter, i) => (
                                <button
                                    key={i}
                                    className={`px-3.5 py-1.5 rounded-full border text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 p-2 sm:p-4 gap-y-6 sm:gap-y-10 gap-x-2.5 sm:gap-x-6">
                        {products.map((product) => (
                            <div key={product.id} className="flex flex-col group relative w-full bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 h-full">
                                {/* Image Container */}
                                <div className="relative aspect-square w-full bg-[#F5F5F5] flex items-center justify-center p-2 overflow-hidden">
                                    <img src={product.image} alt={product.name} className="w-[85%] h-[85%] object-contain transition-transform duration-500 group-hover:scale-110" />

                                    {/* Discount Badge - Top Left */}
                                    <div className="absolute top-1 left-1 z-10 scale-[0.8] sm:scale-90 origin-top-left">
                                        <div className="relative">
                                            <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                                                <path d="M24 0L27.9 5.7L34.5 4.5L36.3 11.1L42.9 12.9L41.7 19.5L47.4 23.4L41.7 27.3L42.9 33.9L36.3 35.7L34.5 42.3L27.9 41.1L24 46.8L20.1 41.1L13.5 42.3L11.7 35.7L5.1 33.9L6.3 27.3L0.6 23.4L6.3 19.5L5.1 12.9L11.7 11.1L13.5 4.5L20.1 5.7L24 0Z" fill="#8B5CF6" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white leading-none">
                                                <span className="text-[10px] font-black">{product.discount?.replace('% OFF', '')}</span>
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

                                    {/* Ad Tag & Veg Icon */}
                                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-white/70 backdrop-blur-md rounded px-1.5 py-0.5">
                                        {product.isAd && <span className="text-[8px] sm:text-[9px] font-black text-gray-700 uppercase tracking-tighter">Ad</span>}
                                        {product.isVeg && (
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 border border-green-600 flex items-center justify-center p-[0.5px] bg-white rounded-sm">
                                                <div className="w-full h-full bg-green-600 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info Container */}
                                <div className="p-3 flex flex-col flex-1">
                                    <div className="flex-1 space-y-1">
                                        <div className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-wider">{product.deliveryTime}</div>
                                        <h3 className="text-[14px] font-[800] text-[#101828] line-clamp-2 leading-[1.3] tracking-tight min-h-[36px]">
                                            {product.name}
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-500">
                                            {product.weight}
                                        </p>
                                    </div>

                                    {/* Price and Add Button */}
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-[#101828] leading-none">₹{product.price}</span>
                                            {product.originalPrice && (
                                                <span className="text-[11px] text-slate-400 line-through font-bold mt-0.5">₹{product.originalPrice}</span>
                                            )}
                                        </div>
                                        <AddToCartButton
                                            item={{
                                                ...product,
                                                restaurant: "Hibermart",
                                                restaurantId: "hibermart-id"
                                            }}
                                            className="w-[75px] sm:w-[85px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </AnimatedPage>
    )
}
