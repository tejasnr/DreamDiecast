'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, LogOut, Package, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';
import SearchModal from './SearchModal';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-display font-bold tracking-tighter uppercase italic">
            Dream<span className="text-accent">Diecast</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
            <Link href="/brands" className="hover:text-accent transition-colors">Brands</Link>
            <Link href="/new-arrivals" className="hover:text-accent transition-colors">New Arrivals</Link>
            <Link href="/pre-orders" className="hover:text-accent transition-colors">Pre-Orders</Link>
            <Link href="/bundles" className="hover:text-accent transition-colors">Bundles</Link>
          </div>

          <div className="flex items-center space-x-6">
            <button className="hover:text-accent transition-colors" onClick={() => setIsSearchOpen(true)}>
              <Search size={20} />
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-accent transition-colors"
                >
                  <Image
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || user.email}`}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-48 glass border border-white/10 p-2 shadow-2xl"
                      >
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors rounded-sm"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Shield size={14} className="text-accent" />
                            Admin
                          </Link>
                        )}
                        <Link
                          href="/garage"
                          className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors rounded-sm"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Package size={14} className="text-accent" />
                          My Purchases
                        </Link>
                        <button
                          onClick={() => { logout(); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 text-red-400 transition-colors rounded-sm"
                        >
                          <LogOut size={14} />
                          Log Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-white text-black px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all rounded-sm shadow-lg shadow-white/5"
                >
                  Login
                </button>
              </div>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-accent transition-colors"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute -top-2 -right-2 bg-accent text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,99,33,0.5)]"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 p-8 flex flex-col space-y-6 md:hidden shadow-2xl"
            >
              <div className="flex flex-col space-y-4">
                <Link href="/brands" className="text-2xl font-display uppercase tracking-tighter" onClick={() => setIsMobileMenuOpen(false)}>Brands</Link>
                <Link href="/new-arrivals" className="text-2xl font-display uppercase tracking-tighter" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link>
                <Link href="/pre-orders" className="text-2xl font-display uppercase tracking-tighter" onClick={() => setIsMobileMenuOpen(false)}>Pre-Orders</Link>
                <Link href="/bundles" className="text-2xl font-display uppercase tracking-tighter" onClick={() => setIsMobileMenuOpen(false)}>Bundles</Link>
              </div>

              {user ? (
                <div className="flex flex-col space-y-4 pt-6 border-t border-white/10">
                  {user.role === 'admin' && (
                    <Link href="/admin" className="text-lg font-display uppercase text-accent flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Shield size={18} /> Admin
                    </Link>
                  )}
                  <Link href="/garage" className="text-lg font-display uppercase text-accent flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Package size={18} /> Purchases
                  </Link>
                  <Link href="/garage?tab=pre-orders" className="text-lg font-display uppercase text-accent flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Clock size={18} /> My Pre-orders
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="text-lg font-display uppercase text-left text-red-400 flex items-center gap-2"
                  >
                    <LogOut size={18} /> Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="bg-white text-black py-4 text-lg font-display uppercase tracking-widest hover:bg-accent hover:text-white transition-all rounded-sm font-bold"
                  >
                    Login / Register
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
