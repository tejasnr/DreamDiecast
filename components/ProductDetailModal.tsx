'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Package, ShieldCheck, Truck, ArrowRight, ShoppingCart, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/lib/data';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/posthog';
import { formatEta } from '@/lib/format';
import AuthModal from './AuthModal';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      trackEvent('product_viewed', { productId: product.id, name: product.name, category: product.category });
      setActiveImageIndex(0);
      setAddedFeedback(false);
    }
  }, [product?.id]);

  if (!product) return null;

  // Build gallery images: prefer images array, fall back to single image
  const galleryImages: string[] = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const hasMultipleImages = galleryImages.length > 1;
  const currentImage = galleryImages[activeImageIndex] || product.image;

  const isPreOrder = product.listingType === 'pre-order' || product.category === 'Pre-Order' || product.isPreorder;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0 && !isPreOrder;
  const resolvedType = product.type || product.details?.type;
  const resolvedCondition = product.condition;
  const resolvedFeatures = product.specialFeatures || product.details?.features?.join(', ');

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    router.push('/checkout/details');
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-6xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-sm overflow-y-auto md:overflow-hidden flex flex-col md:flex-row shadow-2xl custom-scrollbar ${isOutOfStock ? 'grayscale-[0.3]' : ''}`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 w-10 h-10 bg-black/50 text-white flex items-center justify-center rounded-full border border-white/10 hover:bg-accent transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {/* Left: Image Section */}
            <div className="w-full md:w-1/2 relative bg-surface flex-shrink-0 flex flex-col">
              {/* Main Image */}
              <div className="relative aspect-[4/3] md:aspect-auto md:flex-1">
                {currentImage && (
                  <Image
                    src={currentImage}
                    alt={`${product.name} - Image ${activeImageIndex + 1}`}
                    fill
                    className="object-contain"
                    priority={activeImageIndex === 0}
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />

                {/* Arrow Navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/60 text-white flex items-center justify-center rounded-full border border-white/20 hover:bg-accent transition-colors backdrop-blur-md"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % galleryImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/60 text-white flex items-center justify-center rounded-full border border-white/20 hover:bg-accent transition-colors backdrop-blur-md"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <span className="bg-red-600 text-white px-8 py-3 text-xl font-display font-bold uppercase tracking-[0.3em] shadow-2xl">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {hasMultipleImages && (
                <div className="flex gap-1 p-2 overflow-x-auto bg-black/40 backdrop-blur-md">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 flex-shrink-0 overflow-hidden border-2 transition-all ${
                        idx === activeImageIndex ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - Image ${idx + 1}`}
                        fill
                        className="object-cover"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info Section */}
            <div className="w-full md:w-1/2 p-6 md:p-12 md:overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                {/* Header Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-accent font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
                      {product.brand}
                    </span>
                    <span className="w-8 h-[1px] bg-white/20" />
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-[0.3em]">
                      Scale {product.scale}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tighter leading-none mb-4">
                    {product.name}
                  </h2>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.floor(product.rating || 0) ? 'currentColor' : 'none'}
                          className={i < Math.floor(product.rating || 0) ? '' : 'opacity-30'}
                        />
                      ))}
                      <span className="ml-2 text-sm font-mono font-bold text-white">
                        {product.rating || 'N/A'}
                      </span>
                    </div>
                    <span className="text-white/20 text-xs uppercase tracking-widest">
                      {product.reviews?.length || 0} Reviews
                    </span>
                    {product.stock !== undefined && !isPreOrder && (
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                        product.stock > 5 ? 'text-white/40 border border-white/10' : 'text-orange-500 border border-orange-500/20 bg-orange-500/5'
                      }`}>
                        {product.stock <= 0
                          ? 'Out of Stock'
                          : product.stock <= 5
                            ? 'Only Few Left'
                            : 'In Stock'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-col gap-6 py-6 border-y border-white/5">
                  <div>
                    <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">
                      {isPreOrder ? 'Booking Advance' : 'Price'}
                    </span>
                    <span className="text-3xl font-display font-bold text-white">
                      ₹{isPreOrder ? (product.bookingAdvance ?? product.price).toLocaleString() : product.price.toLocaleString()}
                    </span>
                    {isPreOrder && product.totalFinalPrice && (
                      <span className="text-[10px] text-white/20 uppercase tracking-widest block mt-1">
                        Full Price: ₹{product.totalFinalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {/* Add to Cart */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`flex-1 px-8 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isOutOfStock
                          ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                          : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {addedFeedback ? (
                        <><Check size={18} /> Added!</>
                      ) : isOutOfStock ? (
                        <><X size={18} /> Out of Stock</>
                      ) : isPreOrder ? (
                        <><ShoppingCart size={18} /> Pre-order</>
                      ) : (
                        <><ShoppingCart size={18} /> Add to Cart</>
                      )}
                    </button>

                    {/* Buy Now / Checkout */}
                    {!isOutOfStock && (
                      <button
                        onClick={handleBuyNow}
                        className="flex-1 px-8 py-4 font-display font-bold uppercase tracking-wider bg-accent text-white hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2"
                      >
                        {isPreOrder ? (
                          <><ArrowRight size={18} /> Pre-order &amp; Checkout</>
                        ) : (
                          <><ArrowRight size={18} /> Buy Now</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto-generated description from structured data */}
                {isPreOrder && (
                  <div className="space-y-3 bg-accent/5 border border-accent/20 p-4 rounded-sm">
                    <p className="text-xs text-accent/80 italic">
                      Check the product description for the final pricing and ETA of the chosen models.
                    </p>
                    <div className="space-y-1 text-sm text-white/60">
                      {product.totalFinalPrice && (
                        <p>Final Price — ₹{product.totalFinalPrice.toLocaleString()}</p>
                      )}
                      {product.eta && <p>ETA — {formatEta(product.eta)}</p>}
                    </div>
                  </div>
                )}

                {resolvedFeatures && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Special Features</h4>
                    <p className="text-white/60 text-sm leading-relaxed">{resolvedFeatures}</p>
                  </div>
                )}

                {/* Specifications */}
                <div className="grid grid-cols-2 gap-6 py-6 border-t border-white/5">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Brand</h4>
                    <p className="text-sm text-white font-medium">{product.brand}</p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Scale</h4>
                    <p className="text-sm text-white font-medium">{product.scale}</p>
                  </div>
                  {resolvedCondition && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Condition</h4>
                      <p className="text-sm text-white font-medium">{resolvedCondition}</p>
                    </div>
                  )}
                  {resolvedType && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Type</h4>
                      <p className="text-sm text-white font-medium">{resolvedType}</p>
                    </div>
                  )}
                </div>

                {/* Manual description */}
                {product.description && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Description</h4>
                    <p className="text-white/60 text-sm leading-relaxed font-light">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 py-6 bg-white/[0.02] rounded-sm px-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Package size={18} className="text-accent" />
                    <span className="text-[8px] uppercase tracking-widest text-white/40">Secure Packing</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2">
                    <ShieldCheck size={18} className="text-accent" />
                    <span className="text-[8px] uppercase tracking-widest text-white/40">Authentic Model</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Truck size={18} className="text-accent" />
                    <span className="text-[8px] uppercase tracking-widest text-white/40">Global Shipping</span>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-6 pt-8 border-t border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Customer Reviews</h4>
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {product.reviews.map((review, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{review.user}</span>
                            <div className="flex items-center text-accent">
                              {[...Array(5)].map((_, starIdx) => (
                                <Star
                                  key={starIdx}
                                  size={10}
                                  fill={starIdx < review.rating ? 'currentColor' : 'none'}
                                  className={starIdx < review.rating ? '' : 'opacity-30'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-white/40 leading-relaxed italic">&quot;{review.comment}&quot;</p>
                          <span className="text-[8px] text-white/20 uppercase tracking-widest block">{review.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/20 italic">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
