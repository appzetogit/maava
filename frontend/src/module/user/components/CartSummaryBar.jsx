import { Link, useLocation } from "react-router-dom"
import { ChevronUp } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useHibermartCart } from "../context/HibermartCartContext"
import { motion, AnimatePresence } from "framer-motion"
import { useScrollDirection } from "../hooks/useScrollDirection"

export default function CartSummaryBar() {
    const { cart: foodCart, itemCount: foodItemCount } = useCart()
    const { cart: hibermartCart, itemCount: hibermartItemCount } = useHibermartCart()
    const scrollDirection = useScrollDirection()
    const location = useLocation()

    const isHibermartPage = location.pathname.startsWith("/in-mart") || location.pathname.startsWith("/user/in-mart")
    const isSearchPage = location.pathname.includes("/search")

    // On Hibermart pages, show hibermart cart; on food pages, show food cart
    // On search page, show whichever cart has items (prefer hibermart if both have items and on hibermart-adjacent page)
    let activeCart, activeItemCount, isHibermartCart

    if (isSearchPage) {
        // On search page show Hibermart cart if it has items, else food cart
        if (hibermartItemCount > 0) {
            activeCart = hibermartCart
            activeItemCount = hibermartItemCount
            isHibermartCart = true
        } else {
            activeCart = foodCart
            activeItemCount = foodItemCount
            isHibermartCart = false
        }
    } else if (isHibermartPage) {
        activeCart = hibermartCart
        activeItemCount = hibermartItemCount
        isHibermartCart = true
    } else {
        activeCart = foodCart
        activeItemCount = foodItemCount
        isHibermartCart = false
    }

    if (activeItemCount === 0) return null

    // Dynamic colors based on cart type
    const themeColor = isHibermartCart ? "text-blue-600" : "text-green-600"
    const buttonColor = isHibermartCart ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"

    // Cart URL based on type
    const cartUrl = isHibermartCart ? "/in-mart/cart" : "/cart"

    // Calculate total savings
    const totalSavings = activeCart.reduce((sum, item) => {
        const originalPrice = item.originalPrice || item.price
        return sum + (originalPrice - item.price) * item.quantity
    }, 0)

    // Get first item image for the thumbnail
    const firstItemImage = activeCart[0]?.image || activeCart[0]?.imageUrl

    // Determine if it should be in the "up" position (above nav) or "down" position (at bottom)
    const isNavVisible = scrollDirection === "up"

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="cart-summary-bar"
                initial={{ y: 100, opacity: 0 }}
                animate={{
                    y: 0,
                    opacity: 1,
                    bottom: isNavVisible ? 70 : 8
                }}
                exit={{ y: 100, opacity: 0 }}
                transition={{
                    y: { duration: 0.3, ease: "easeOut" },
                    bottom: { duration: 0.3, ease: "easeInOut" }
                }}
                className="fixed left-0 right-0 z-[49] px-3 pb-2 md:hidden"
            >
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Item Thumbnail */}
                        <div className="w-12 h-12 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 flex-shrink-0">
                            <img src={firstItemImage} alt="cart item" className="w-full h-full object-contain" />
                        </div>

                        {/* Item Count and Savings */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">
                                    {activeItemCount} {activeItemCount === 1 ? 'Item' : 'Items'}
                                </span>
                                <ChevronUp size={16} className={themeColor} />
                            </div>
                            {totalSavings > 0 && (
                                <span className="text-green-600 text-xs font-bold">
                                    You save ₹{Math.round(totalSavings)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* View Cart Button */}
                    <Link
                        to={cartUrl}
                        className={`${buttonColor} text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm`}
                    >
                        View Cart
                    </Link>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
