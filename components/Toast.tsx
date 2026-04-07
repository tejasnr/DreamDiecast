'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import Image from 'next/image';

interface ToastProps {
  isVisible: boolean;
  message: string;
  productImage?: string;
  onClose: () => void;
}

export default function Toast({ isVisible, message, productImage, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
          className="fixed bottom-8 left-1/2 z-[200] w-full max-w-sm"
        >
          <div className="mx-4 glass border-white/10 p-4 shadow-2xl flex items-center gap-4 overflow-hidden relative group">
            {/* Progress bar */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 3, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-accent"
            />

            {productImage ? (
              <div className="relative w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 border border-white/5">
                <Image
                  src={productImage}
                  alt="Product"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent flex-shrink-0">
                <CheckCircle2 size={20} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-white truncate">
                {message}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                Added to your collection
              </p>
            </div>

            <button 
              onClick={onClose}
              className="text-white/20 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
