import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function SplashScreen() {
    const [showSplash, setShowSplash] = useState(() => {
        if (typeof window !== "undefined") {
            return !sessionStorage.getItem("maavaSplashShown")
        }
        return false
    })

    useEffect(() => {
        if (showSplash) {
            const timer = setTimeout(() => {
                setShowSplash(false)
                sessionStorage.setItem("maavaSplashShown", "true")
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [showSplash])

    return (
        <AnimatePresence>
            {showSplash && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[99999] bg-white flex items-center justify-center overflow-hidden"
                >
                    {/* Soft ambient glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50" />

                    {/* Double Ring Logo */}
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative flex flex-col items-center"
                    >
                        {/* Background glow */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-72 h-72 rounded-full bg-[#8B5CF6] blur-3xl -z-10"
                        />

                        {/* Outer Ring (white with shadow) */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
                            className="w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-white shadow-[0_8px_60px_rgba(139,92,246,0.25)] flex items-center justify-center p-3.5 ring-1 ring-purple-100/50"
                        >
                            {/* Inner Circle (purple) */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
                                className="w-full h-full rounded-full bg-[#8B5CF6] flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
                            >
                                {/* Subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10 pointer-events-none" />

                                {/* Maava Text */}
                                <motion.span
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 1.0 }}
                                    className="text-white text-3xl sm:text-4xl font-[1000] italic tracking-widest uppercase leading-none drop-shadow-md relative z-10"
                                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                                >
                                    Maava
                                </motion.span>
                                <motion.div
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 0.5 }}
                                    transition={{ duration: 0.4, delay: 1.3 }}
                                    className="w-16 h-[2px] bg-white/50 rounded-full mt-2 relative z-10 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
