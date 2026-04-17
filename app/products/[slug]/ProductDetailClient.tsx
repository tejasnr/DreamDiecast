'use client';

import { useEffect, useState } from 'react';
import { Star, Package, ShieldCheck, Truck, ArrowRight, ShoppingCart, ChevronLeft, ChevronRight, Check, Flame, Minus, Plus, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { trackEvent } from '@/lib/posthog';
import { formatEta } from '@/lib/format';
import AuthModal from '@/components/AuthModal';
import { Loader2 } from 'lucide-react';
import { idFromSlug } from '@/lib/slugify';

export default function ProductDetailClient({ slug }: { slug: string }) {
  const productId = idFromSlug(slug);
  const product = useQuery(api.products.getById, { id: productId as Id<'products'> });
  const { addToCart, cart } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  const userOrders = useQuery(
    api.orders.byUser,
    user ? { userId: user.convexUserId as Id<'users'> } : 'skip'
  );

  useEffect(() => {
    if (product) {
      trackEvent('product_viewed', { productId: product.id, name: product.name, category: product.category });
      setActiveImageIndex(0);
      setAddedFeedback(false);
      setSelectedQty(1);
    }
  }, [product?.id]);

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4">Product Not Found</h1>
        <p className="text-white/40 max-w-md mb-8 uppercase tracking-widest text-xs">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/products" className="bg-white text-black px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all">
          Browse All Models
        </Link>
      </div>
    );
  }

  const galleryImages: string[] = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const hasMultipleImages = galleryImages.length > 1;
  const currentImage = galleryImages[activeImageIndex] || product.image;

  const isPreOrder = product.listingType === 'pre-order' || product.category === 'Pre-Order' || product.isPreorder;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0 && !isPreOrder;
  const isHype = product.isHype === true;
  const isInCart = cart.some(item => item.id === product.id);
  const hypeOrdersLoading = isHype && user && userOrders === undefined;
  const alreadyPurchasedHype = isHype && userOrders?.some(
    order =>
      order.orderStatus !== 'cancelled' &&
      order.paymentStatus !== 'rejected' &&
      order.items.some(oi => oi.productId === product.id)
  );
  const cannotAdd = isOutOfStock || !!alreadyPurchasedHype || (isHype && isInCart) || !!hypeOrdersLoading;
  const cartQty = cart.find(item => item.id === product.id)?.quantity ?? 0;
  const maxQty = isHype ? 1 : (!isPreOrder && product.stock !== undefined ? Math.max(0, product.stock - cartQty) : 99);
  const resolvedType = product.type || product.details?.type;
  const resolvedCondition = product.condition;
  const resolvedFeatures = product.specialFeatures || product.details?.features?.join(', ');

  const handleAddToCart = async () => {
    if (cannotAdd || selectedQty < 1) return;
    await addToCart(product as any, selectedQty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cannotAdd || selectedQty < 1) return;
    await addToCart(product as any, selectedQty);
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    router.push('/checkout/details');
  };

  return (
    <>
      <main className="min-h-screen bg-[#050505] pt-24 pb-20">
        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-6 mb-8">
          <ol className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-white transition-colors">Products</Link></li>
            <li>/</li>
            <li><Link href={`/brands/${product.brand.toLowerCase().replace(/\s+/g, '')}`} className="hover:text-white transition-colors">{product.brand}</Link></li>
            <li>/</li>
            <li className="text-white/60">{product.name}</li>
          </ol>
        </nav>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Left: Image Gallery */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="relative aspect-square bg-surface rounded-sm overflow-hidden">
                {currentImage && (
                  <Image
                    src={currentImage}
                    alt={`${product.name} - ${product.brand} ${product.scale} Scale Diecast Model`}
                    fill
                    className="object-contain"
                    priority
                    referrerPolicy="no-referrer"
                  />
                )}
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
              {hasMultipleImages && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 flex-shrink-0 overflow-hidden border-2 transition-all rounded-sm ${
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

            {/* Right: Product Info */}
            <div className="w-full md:w-1/2 space-y-8">
              {/* Header */}
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
                <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tighter leading-none mb-4">
                  {product.name}
                </h1>

                {isHype && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-sm w-fit">
                    <Flame size={14} className="text-red-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                      HYPE DROP — 1 PER PERSON
                    </span>
                  </div>
                )}

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
                      {product.stock <= 0 ? 'Out of Stock' : product.stock <= 5 ? 'Only Few Left' : 'In Stock'}
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

                {!cannotAdd && (
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Qty</span>
                    <div className="flex items-center border border-white/10 rounded-sm">
                      <button
                        onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                        disabled={selectedQty <= 1}
                        className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 h-10 flex items-center justify-center text-sm font-mono font-bold text-white border-x border-white/10">
                        {selectedQty}
                      </span>
                      <button
                        onClick={() => setSelectedQty(q => Math.min(maxQty, q + 1))}
                        disabled={selectedQty >= maxQty}
                        className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handleAddToCart}
                    disabled={cannotAdd}
                    className={`flex-1 px-8 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      cannotAdd
                        ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {alreadyPurchasedHype ? (
                      <><Check size={18} /> Already Purchased</>
                    ) : isHype && isInCart ? (
                      <><Check size={18} /> Already in Cart</>
                    ) : hypeOrdersLoading ? (
                      <>Loading...</>
                    ) : addedFeedback ? (
                      <><Check size={18} /> Added!</>
                    ) : isOutOfStock ? (
                      <><X size={18} /> Out of Stock</>
                    ) : isPreOrder ? (
                      <><ShoppingCart size={18} /> Pre-order</>
                    ) : (
                      <><ShoppingCart size={18} /> Add to Cart</>
                    )}
                  </button>

                  {!cannotAdd && (
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

              {/* Pre-order info */}
              {isPreOrder && (
                <div className="space-y-3 bg-accent/5 border border-accent/20 p-4 rounded-sm">
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
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Special Features</h2>
                  <p className="text-white/60 text-sm leading-relaxed">{resolvedFeatures}</p>
                </div>
              )}

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-6 py-6 border-t border-white/5">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Brand</h3>
                  <p className="text-sm text-white font-medium">{product.brand}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Scale</h3>
                  <p className="text-sm text-white font-medium">{product.scale}</p>
                </div>
                {resolvedCondition && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Condition</h3>
                    <p className="text-sm text-white font-medium">{resolvedCondition}</p>
                  </div>
                )}
                {resolvedType && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Type</h3>
                    <p className="text-sm text-white font-medium">{resolvedType}</p>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="space-y-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Description</h2>
                  <p className="text-white/60 text-sm leading-relaxed font-light">{product.description}</p>
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

              {/* Reviews */}
              <div className="space-y-6 pt-8 border-t border-white/5">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Customer Reviews</h2>
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/20 italic">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
