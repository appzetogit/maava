import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Zap, ShoppingBag } from 'lucide-react';
import maavaBanner from '@/assets/maava_banner.png';

const ZomatoBanner = () => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* Premium Background Image with Ken Burns Effect */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          src={maavaBanner} 
          alt="Premium Maava Banner" 
          className="w-full h-full object-cover"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        {/* Animated Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 z-1" />
      </div>

      {/* Main Promotion Content */}
      <div className="relative z-20 text-center px-4 pt-36 sm:pt-40 lg:pt-44 pb-10">
        {/* Express Label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full mb-6 mx-auto w-fit font-black italic text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)]"
        >
          <Zap className="w-4 h-4 fill-current text-yellow-400" />
          Ultra Fast Delivery
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-block relative"
        >
          <h2 className="text-white font-[1000] text-5xl sm:text-8xl italic uppercase leading-none tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
             PREMIUM
          </h2>
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-[-10px] sm:mt-[-25px]">
             <h2 className="text-yellow-400 font-[1000] text-6xl sm:text-9xl italic uppercase leading-none tracking-tighter drop-shadow-2xl">
              DEAL
            </h2>
            <div className="bg-white text-black px-4 sm:px-8 py-1 sm:py-3 rounded-2xl text-4xl sm:text-7xl font-[1000] shadow-[0_15px_40px_rgba(255,255,255,0.3)] -rotate-3 border-4 border-yellow-400">
                50%
            </div>
          </div>
        </motion.div>

        {/* CTA Only */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 sm:mt-10 flex flex-col items-center gap-6"
        >
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black hover:bg-neutral-100 transition-all px-12 py-4 rounded-2xl font-black text-sm sm:text-xl flex items-center gap-3 group shadow-2xl"
          >
            ORDER NOW <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Floating Accent */}
      <div className="absolute bottom-10 left-10 hidden lg:block">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
             <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Maava Original Quality</span>
          </div>
      </div>
    </div>
  );
};

export default ZomatoBanner;
