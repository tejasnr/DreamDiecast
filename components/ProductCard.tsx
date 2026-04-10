'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { Product } from '@/lib/data';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0 && product.category !== 'Pre-Order';
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5 && product.category !== 'Pre-Order';

  const galleryImages = product.images?.length ? product.images : product.image ? [product.image] : [];
  const hasMultiple = galleryImages.length > 1;
  const currentImage = galleryImages[activeImageIndex] || product.image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative cursor-pointer ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
      onClick={() => !isOutOfStock && onClick?.(product)}
    >
      <div className="relative aspect-square overflow-hidden bg-surface rounded-sm border border-white/5">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-white/20 text-xs font-mono uppercase">
            No Image
          </div>
        )}

        {/* Image Navigation Arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 text-white flex items-center justify-center rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md hover:bg-accent"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 text-white flex items-center justify-center rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md hover:bg-accent"
            >
              <ChevronRight size={16} />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === activeImageIndex ? 'bg-accent w-3' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 ${
            product.category === 'Pre-Order' ? 'bg-accent text-white' :
            product.category === 'New Arrival' ? 'bg-white text-black' : 'bg-white/10 text-white'
          }`}>
            {product.category}
          </span>
          {isOutOfStock && (
            <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1">
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="bg-orange-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1">
              Only Few Left
            </span>
          )}
        </div>

        {/* Technical Info Overlay */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/80 backdrop-blur-sm p-2 border border-white/10 flex flex-col items-end">
            <span className="text-[8px] text-accent font-mono uppercase tracking-widest">Mint Condition</span>
            <span className="text-[8px] text-white/60 font-mono uppercase tracking-widest">Metal Chassis</span>
          </div>
        </div>

        {/* Quick Add Button */}
        {!isOutOfStock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white text-black flex items-center justify-center rounded-full opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-accent hover:text-white glow-orange"
          >
            <ShoppingCart size={18} />
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] text-accent uppercase tracking-widest font-mono font-bold">
              {product.brand}
            </span>
            <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-mono">
              Scale {product.scale}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-display font-bold text-white">
              ₹{product.category === 'Pre-Order' ? '100' : product.price.toLocaleString()}
            </span>
            {product.category === 'Pre-Order' && (
              <span className="text-[8px] text-accent font-bold uppercase tracking-widest">
                Booking Price
              </span>
            )}
          </div>
        </div>
        <h3 className="text-sm font-medium text-white/80 group-hover:text-accent transition-colors line-clamp-1 uppercase tracking-tight">
          {product.name}
        </h3>
      </div>
    </motion.div>
  );
}
