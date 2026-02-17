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
                            <div key={product.id || product._id} className="flex flex-col group relative w-full bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-neutral-200/20 border border-neutral-100 h-full p-2 sm:p-3 hover:border-black transition-all">
                                {/* Image Container */}
                                <div className="relative aspect-square w-full bg-[#F8F9FA] rounded-[2rem] flex items-center justify-center p-3 overflow-hidden">
                                    <img src={product.image || "https://via.placeholder.com/200"} alt={product.name} className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover:scale-110" />

                                    {/* Sunburst Discount Badge matching Screenshot 2 */}
                                    {product.discount && (
                                        <div className="absolute top-2 left-2 z-20 w-8 h-8 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-[#7B61FF] rotate-[22.5deg] rounded-lg shadow-sm" />
                                            <div className="absolute inset-0 bg-[#7B61FF] rotate-[67.5deg] rounded-lg shadow-sm" />
                                            <span className="relative z-30 text-[7px] font-black text-white leading-tight text-center px-1 uppercase whitespace-pre-line">
                                                {product.discount.split(' ').join('\n')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Ad Tag & Veg Icon */}
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-lg px-2 py-0.5 border border-neutral-100 shadow-sm">
                                        <span className="text-[7px] sm:text-[8px] font-black text-[#101828] uppercase tracking-tighter">AD</span>
                                        <div className="w-[10px] h-[10px] sm:w-3 sm:h-3 border border-emerald-500 flex items-center justify-center p-[0.5px] bg-white rounded-full">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Info Container */}
                                <div className="px-2 pt-3 pb-2 flex flex-col flex-1">
                                    <div className="flex-1 space-y-1">
                                        <div className="text-[8px] sm:text-[9px] font-black text-neutral-400 uppercase tracking-widest">{product.deliveryTime || '10 MINS'}</div>
                                        <h3 className="text-[13px] sm:text-[14px] font-bold text-[#101828] line-clamp-2 leading-[1.2] tracking-tight min-h-[34px]">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400">
                                            {product.weight || '1 unit'}
                                        </p>
                                    </div>

                                    {/* Price and Add Button */}
                                    <div className="mt-4 pt-2 flex items-center justify-between gap-2 border-t border-neutral-50/10">
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-black text-[#101828] leading-none">₹{product.price}</span>
                                            {product.originalPrice && product.originalPrice !== product.price && (
                                                <span className="text-[11px] text-neutral-300 line-through font-bold mt-1">₹{product.originalPrice}</span>
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
