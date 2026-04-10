'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AuthModal from './AuthModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    onClose();
    router.push('/checkout/details');
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0A0A0A] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-accent" />
                <h2 className="text-xl font-display font-bold uppercase tracking-tight">Your Cart</h2>
                <span className="bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full text-white/60">
                  {cartCount}
                </span>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative w-24 h-24 bg-surface rounded-sm overflow-hidden flex-shrink-0 border border-white/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-1 uppercase tracking-tight">
                            {item.name}
                          </h3>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-white/20 hover:text-red-500 transition-colors ml-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                          {item.brand} | {item.scale}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center border border-white/10 rounded-sm">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          {item.stock !== undefined && item.quantity >= item.stock && item.category !== 'Pre-Order' && (
                            <span className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">
                              Max Stock Reached
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-display font-bold text-white">
                          ₹{item.category === 'Pre-Order' 
                            ? (100 * item.quantity).toLocaleString() 
                            : (item.price * item.quantity).toLocaleString()}
                        </span>
                        {item.category === 'Pre-Order' && (
                          <span className="text-[8px] text-accent font-bold uppercase tracking-widest block mt-1">
                            Booking Price
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <ShoppingBag size={48} />
                  <p className="uppercase tracking-[0.3em] text-xs font-bold">Your cart is empty</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="text-2xl font-display font-bold text-white">₹{cartTotal.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-white/20 uppercase tracking-widest text-center">
                  Shipping and taxes calculated at checkout
                </p>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-accent text-white py-4 font-display font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2"
                >
                  Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
