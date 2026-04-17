'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProducts } from '@/hooks/useProducts';
import { productSlug } from '@/lib/slugify';
import Link from 'next/link';
import Image from 'next/image';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }, [debouncedQuery, products]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mx-auto mt-24 sm:mt-32 px-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#0a0a0a] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 p-6 border-b border-white/10">
                  <Search size={20} className="text-white/40 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name or brand..."
                    className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/20 font-display uppercase tracking-wider"
                  />
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {debouncedQuery.trim() && results.length === 0 && (
                    <div className="p-12 text-center">
                      <p className="text-white/20 text-xs uppercase tracking-[0.3em]">No results found</p>
                    </div>
                  )}

                  {results.map(product => (
                    <Link
                      key={product.id}
                      href={`/products/${productSlug(product)}`}
                      onClick={onClose}
                      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                    >
                      <div className="relative w-16 h-12 bg-white/5 shrink-0 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-accent text-[10px] font-bold uppercase tracking-widest">{product.brand}</p>
                        <p className="text-white font-display font-bold uppercase tracking-tight truncate">{product.name}</p>
                      </div>
                      <p className="text-white/60 font-display font-bold shrink-0">
                        {'\u20B9'}{product.price.toLocaleString()}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
