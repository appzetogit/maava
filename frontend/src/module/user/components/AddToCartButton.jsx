import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Plus, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "../context/CartContext"
import { useHibermartCart } from "../context/HibermartCartContext"

export default function AddToCartButton({ item, className = "", disabled = false, size = "sm" }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isHibermartItem = item?.restaurantId === 'hibermart-id' || item?.restaurant === 'Hibermart'
  const foodCart = useCart()
  const hibermartCartCtx = useHibermartCart()
  const cartCtx = isHibermartItem ? hibermartCartCtx : foodCart
  const { addToCart, isInCart, getCartItem, updateQuantity, cart } = cartCtx
  
  const hasVariations = item?.variations && item.variations.length > 0
  const inCart = isInCart(item.id)
  const cartItem = getCartItem(item.id)

  const totalVariationsInCart = hasVariations
    ? cart.filter(c => c.baseId === item.id).reduce((sum, c) => sum + (c.quantity || 0), 0)
    : 0

  const getSourcePosition = (e) => {
    // If e is null (e.g., from modal without event), use screen center
    if (!e || !e.currentTarget) {
      return {
        viewportX: window.innerWidth / 2,
        viewportY: window.innerHeight / 2,
        scrollX: window.pageXOffset || window.scrollX || 0,
        scrollY: window.pageYOffset || window.scrollY || 0,
        itemId: item.id,
      }
    }
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      viewportX: rect.left + rect.width / 2,
      viewportY: rect.top + rect.height / 2,
      scrollX: window.pageXOffset || window.scrollX || 0,
      scrollY: window.pageYOffset || window.scrollY || 0,
      itemId: item.id,
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    
    if (hasVariations) {
      setIsModalOpen(true)
      return
    }
    
    const sourcePosition = getSourcePosition(e)
    addToCart(item, sourcePosition)
  }

  const handleIncrease = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    const sourcePosition = getSourcePosition(e)
    updateQuantity(item.id, (cartItem?.quantity || 0) + 1, sourcePosition, item)
  }

  const handleDecrease = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    const sourcePosition = getSourcePosition(e)
    updateQuantity(item.id, (cartItem?.quantity || 0) - 1, sourcePosition, item)
  }

  return (
    <>
      {inCart && !hasVariations ? (
        <div className={`flex items-center justify-center ${className}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          {size === "lg" ? (
            <div className="bg-white w-full border border-emerald-200 font-black text-emerald-600 px-3 py-1.5 rounded-xl shadow-sm flex items-center justify-between">
              <button
                onClick={handleDecrease}
                className="hover:scale-125 transition-transform"
                disabled={disabled}
              >
                <Minus size={14} strokeWidth={4} />
              </button>
              <span className="mx-2 text-sm">{cartItem?.quantity || 0}</span>
              <button
                onClick={handleIncrease}
                className="hover:scale-125 transition-transform"
                disabled={disabled}
              >
                <Plus size={14} strokeWidth={4} />
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-0.5 border rounded-lg overflow-hidden h-7 bg-white dark:bg-black/20 ${disabled ? "border-gray-300 opacity-50" : "border-green-600"}`}>
              <Button
                variant="ghost"
                size="icon"
                className={`h-full w-6 rounded-none transition-colors ${disabled ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:bg-green-50"}`}
                onClick={handleIncrease}
                disabled={disabled}
              >
                <Plus className="h-3 w-3" strokeWidth={3} />
              </Button>
              <span className={`px-1 text-[11px] font-bold min-w-[1rem] text-center ${disabled ? "text-gray-400" : "text-green-600"}`}>
                {cartItem?.quantity || 0}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={`h-full w-6 rounded-none transition-colors ${disabled ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:bg-green-50"}`}
                onClick={handleDecrease}
                disabled={disabled}
              >
                <Minus className="h-3 w-3" strokeWidth={3} />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={disabled}
            className={size === "lg" 
              ? `w-full bg-white border border-neutral-200 font-black text-emerald-600 px-6 py-2 rounded-xl shadow-lg hover:border-emerald-500 transition-all uppercase tracking-widest text-sm active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
              : `h-7 px-2 sm:px-2.5 font-black rounded-lg text-[9px] sm:text-[10px] transition-all transform active:scale-95 shadow-sm relative ${disabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70"
              : "bg-white dark:bg-transparent border border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              }`}
          >
            ADD
            {totalVariationsInCart > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {totalVariationsInCart}
              </span>
            )}
          </Button>
          {hasVariations && (
            <span className={`mt-1.5 px-2 py-0.5 bg-white/95 shadow-sm border border-gray-100 rounded-full text-gray-500 tracking-tight ${size === "lg" ? "text-[10px] font-bold" : "text-[9px]"}`}>
              Customisable
            </span>
          )}
        </div>
      )}

      {/* Variations Modal */}
      {isModalOpen && hasVariations && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsModalOpen(false); }}
        >
          <div 
            className="bg-white w-full sm:w-[400px] sm:rounded-xl rounded-t-xl p-5 shadow-xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Customise as per your taste</h3>
                <p className="text-sm text-gray-500">{item.name}</p>
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsModalOpen(false); }} 
                className="p-1.5 rounded-full hover:bg-gray-100 bg-gray-50 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4">
              {item.variations.map((variation) => {
                const varId = `${item.id}-${variation.id}`
                const varInCart = isInCart(varId)
                const varCartItem = getCartItem(varId)
                
                return (
                  <div key={variation.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{variation.name}</p>
                      <p className="text-sm text-gray-600 font-semibold">₹{parseFloat(variation.price).toFixed(2)}</p>
                    </div>
                    <div>
                      {varInCart ? (
                        <div className="flex items-center gap-1 border border-green-600 rounded-lg h-8 bg-green-50/50">
                          <button
                            className="w-8 h-full flex items-center justify-center text-green-600 hover:bg-green-100 rounded-l-lg transition-colors"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              updateQuantity(varId, (varCartItem?.quantity || 0) - 1, getSourcePosition(e), { id: varId, name: `${item.name} (${variation.name})` })
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-green-700 w-4 text-center">{varCartItem?.quantity}</span>
                          <button
                            className="w-8 h-full flex items-center justify-center text-green-600 hover:bg-green-100 rounded-r-lg transition-colors"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              updateQuantity(varId, (varCartItem?.quantity || 0) + 1, getSourcePosition(e), { id: varId, name: `${item.name} (${variation.name})` })
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 px-5 font-bold rounded-lg text-xs border border-green-600 text-green-600 hover:bg-green-600 hover:text-white bg-white shadow-sm"
                          onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            const itemToAdd = {
                              ...item,
                              id: varId,
                              baseId: item.id,
                              name: `${item.name} (${variation.name})`,
                              price: parseFloat(variation.price) || 0,
                              variationId: variation.id,
                              variationName: variation.name
                            }
                            addToCart(itemToAdd, getSourcePosition(e))
                          }}
                        >
                          ADD
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}