// HibermartCartContext.jsx
// Separate cart context for Hibermart products — completely independent from restaurant food cart
import { createContext, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "hibermart_cart"

const defaultHibermartCartContext = {
  _isProvider: false,
  cart: [],
  items: [],
  itemCount: 0,
  total: 0,
  lastAddEvent: null,
  lastRemoveEvent: null,
  addToCart: () => { console.warn('HibermartCartProvider not available') },
  removeFromCart: () => { console.warn('HibermartCartProvider not available') },
  updateQuantity: () => { console.warn('HibermartCartProvider not available') },
  getCartCount: () => 0,
  isInCart: () => false,
  getCartItem: () => null,
  clearCart: () => { console.warn('HibermartCartProvider not available') },
}

const HibermartCartContext = createContext(defaultHibermartCartContext)

export function HibermartCartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [lastAddEvent, setLastAddEvent] = useState(null)
  const [lastRemoveEvent, setLastRemoveEvent] = useState(null)

  // Persist Hibermart cart separately
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // ignore storage errors
    }
  }, [cart])

  const addToCart = (item, sourcePosition = null) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        if (sourcePosition) {
          setLastAddEvent({
            product: { id: item.id, name: item.name, imageUrl: item.image || item.imageUrl },
            sourcePosition,
          })
          setTimeout(() => setLastAddEvent(null), 1500)
        }
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }

      const newItem = { ...item, quantity: 1, restaurantId: "hibermart-id", restaurant: "Hibermart" }

      if (sourcePosition) {
        setLastAddEvent({
          product: { id: item.id, name: item.name, imageUrl: item.image || item.imageUrl },
          sourcePosition,
        })
        setTimeout(() => setLastAddEvent(null), 1500)
      }

      return [...prev, newItem]
    })
  }

  const removeFromCart = (itemId, sourcePosition = null, productInfo = null) => {
    setCart((prev) => {
      const itemToRemove = prev.find((i) => i.id === itemId)
      if (itemToRemove && sourcePosition && productInfo) {
        setLastRemoveEvent({
          product: {
            id: productInfo.id || itemToRemove.id,
            name: productInfo.name || itemToRemove.name,
            imageUrl: productInfo.imageUrl || productInfo.image || itemToRemove.image || itemToRemove.imageUrl,
          },
          sourcePosition,
        })
        setTimeout(() => setLastRemoveEvent(null), 1500)
      }
      return prev.filter((i) => i.id !== itemId)
    })
  }

  const updateQuantity = (itemId, quantity, sourcePosition = null, productInfo = null) => {
    if (quantity <= 0) {
      setCart((prev) => {
        const itemToRemove = prev.find((i) => i.id === itemId)
        if (itemToRemove && sourcePosition && productInfo) {
          setLastRemoveEvent({
            product: {
              id: productInfo.id || itemToRemove.id,
              name: productInfo.name || itemToRemove.name,
              imageUrl: productInfo.imageUrl || productInfo.image || itemToRemove.image || itemToRemove.imageUrl,
            },
            sourcePosition,
          })
          setTimeout(() => setLastRemoveEvent(null), 1500)
        }
        return prev.filter((i) => i.id !== itemId)
      })
      return
    }

    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === itemId)
      if (existingItem && quantity < existingItem.quantity && sourcePosition && productInfo) {
        setLastRemoveEvent({
          product: {
            id: productInfo.id || existingItem.id,
            name: productInfo.name || existingItem.name,
            imageUrl: productInfo.imageUrl || productInfo.image || existingItem.image || existingItem.imageUrl,
          },
          sourcePosition,
        })
        setTimeout(() => setLastRemoveEvent(null), 1500)
      }
      return prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    })
  }

  const getCartCount = () => cart.reduce((total, item) => total + (item.quantity || 0), 0)
  const isInCart = (itemId) => cart.some((i) => i.id === itemId)
  const getCartItem = (itemId) => cart.find((i) => i.id === itemId)
  const clearCart = () => setCart([])

  const cartForAnimation = useMemo(() => {
    const items = cart.map(item => ({
      product: { id: item.id, name: item.name, imageUrl: item.image || item.imageUrl },
      quantity: item.quantity || 1,
    }))
    const itemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0)
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
    return { items, itemCount, total }
  }, [cart])

  const value = useMemo(() => ({
    _isProvider: true,
    cart,
    items: cartForAnimation.items,
    itemCount: cartForAnimation.itemCount,
    total: cartForAnimation.total,
    lastAddEvent,
    lastRemoveEvent,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartCount,
    isInCart,
    getCartItem,
    clearCart,
  }), [cart, cartForAnimation, lastAddEvent, lastRemoveEvent])

  return <HibermartCartContext.Provider value={value}>{children}</HibermartCartContext.Provider>
}

export function useHibermartCart() {
  const context = useContext(HibermartCartContext)
  if (!context || context._isProvider !== true) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ useHibermartCart called outside HibermartCartProvider.')
    }
    return defaultHibermartCartContext
  }
  return context
}
