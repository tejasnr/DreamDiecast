'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Copy,
  Check,
  Upload,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Info,
  Clock
} from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { trackEvent } from '@/lib/posthog';
import { PO_SHIPPING_NOTE } from '@/lib/constants';
import { isPreOrderItem } from '@/lib/data';

function CountdownTimer({ expiresAt, onExpired }: { expiresAt: number; onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isLow = timeLeft < 60000;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-sm border text-sm font-mono font-bold ${
      isLow
        ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
        : 'bg-accent/10 border-accent/20 text-accent'
    }`}>
      <Clock size={16} />
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
      <span className="text-[8px] uppercase tracking-widest opacity-60">remaining</span>
    </div>
  );
}

export default function CheckoutPage() {
  const {
    cart,
    cartTotal,
    clearCart,
    checkoutDetails,
    shippingCharges,
    setShippingCharges,
    balancePaymentItem,
    clearBalancePayment,
    appliedCoupon,
    clearCoupon
  } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const createOrder = useAction(api.orders.create);
  const reserveStock = useMutation(api.stockReservations.reserveStock);
  const releaseStock = useMutation(api.stockReservations.releaseStock);

  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const sessionIdRef = useRef(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );
  const reservedRef = useRef(false);
  const redirectingRef = useRef(false);

  const upiId = 'sujithsaravanan2004@okaxis';
  const isAllPreOrder = !balancePaymentItem && cart.length > 0 && cart.every(item => isPreOrderItem(item));
  const hasInStockItems = !balancePaymentItem && cart.some(item => !isPreOrderItem(item));
  const effectiveShippingCharges = isAllPreOrder ? 0 : (appliedCoupon?.shippingWaived ? 0 : shippingCharges);
  const couponDiscount = appliedCoupon?.discountAmount || 0;

  useEffect(() => {
    if (isAllPreOrder && shippingCharges !== 0) {
      setShippingCharges(0);
    }
  }, [isAllPreOrder, shippingCharges, setShippingCharges]);

  // Reserve stock on mount
  useEffect(() => {
    if (!user || reservedRef.current || !hasInStockItems) return;

    const doReserve = async () => {
      try {
        const items = cart.map((item) => ({
          productId: item.id as Id<'products'>,
          quantity: item.quantity,
          isPreOrder: isPreOrderItem(item),
        }));

        const result = await reserveStock({
          userId: user.convexUserId,
          sessionId: sessionIdRef.current,
          items,
        });
        setExpiresAt(result.expiresAt);
        reservedRef.current = true;
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('Insufficient stock')) {
          setReservationError('One or more items in your cart are no longer available. Please go back and try again.');
        } else if (msg.includes('active checkout session')) {
          setReservationError('You have another checkout in progress. Complete or cancel it first.');
        } else if (msg.includes('Hyped models') || msg.includes('limited to 1')) {
          setReservationError('Hyped models are limited to 1 per person.');
        } else if (msg.includes('already have an order') || msg.includes('hyped model')) {
          setReservationError('You already have an order for this hyped model.');
        } else {
          setReservationError('Unable to reserve your items. Please try again.');
        }
      }
    };

    doReserve();
  }, [user, hasInStockItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Release stock on unmount / navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (reservedRef.current && user) {
        // Use sendBeacon for reliability on page close
        navigator.sendBeacon?.('/api/release-stock', JSON.stringify({
          userId: user.convexUserId,
          sessionId: sessionIdRef.current,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also release on component unmount (route change)
      if (reservedRef.current && user && !isSubmitting) {
        releaseStock({
          userId: user.convexUserId,
          sessionId: sessionIdRef.current,
        }).catch(() => {});
        reservedRef.current = false;
      }
    };
  }, [user, isSubmitting]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpired = useCallback(() => {
    if (user && reservedRef.current) {
      releaseStock({
        userId: user.convexUserId,
        sessionId: sessionIdRef.current,
      }).catch(() => {});
      reservedRef.current = false;
    }
    router.push('/?reservation_expired=true');
  }, [user, releaseStock, router]);

  useEffect(() => {
    if (redirectingRef.current) return;
    if (!authLoading && !user) {
      router.push('/');
    }
    if (cart.length === 0 && !balancePaymentItem && !isSubmitting) {
      router.push('/');
    }
    if (!checkoutDetails && !authLoading && !isSubmitting) {
      router.push('/checkout/details');
    }
  }, [user, authLoading, cart, router, isSubmitting, checkoutDetails, balancePaymentItem]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              setScreenshot(resizedFile);
              setScreenshotPreview(canvas.toDataURL('image/jpeg', 0.7));
              setError(null);
            }
          }, 'image/jpeg', 0.7);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || !screenshot || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const reader = new FileReader();
      const paymentProofDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(screenshot);
      });

      const items = balancePaymentItem ? [{
        productId: balancePaymentItem.id as Id<'products'>,
        name: balancePaymentItem.name,
        price: balancePaymentItem.fullPrice,
        image: balancePaymentItem.image,
        category: 'Balance Payment',
        brand: '',
        scale: '',
        quantity: 1,
      }] : cart.map(item => ({
        productId: item.id as Id<'products'>,
        name: item.name,
        price: isPreOrderItem(item) ? (item.bookingAdvance ?? 100) : item.price,
        image: item.image,
        category: item.category || '',
        brand: item.brand || '',
        scale: item.scale || '',
        quantity: item.quantity,
      }));

      const orderId = await createOrder({
        workosUserId: user.workosUserId,
        userId: user.convexUserId as Id<'users'>,
        userEmail: user.email,
        items,
        subtotal: cartTotal,
        shippingCharges: effectiveShippingCharges,
        totalAmount: cartTotal - couponDiscount + effectiveShippingCharges,
        transactionId,
        paymentProofDataUrl,
        paymentMethod: 'UPI',
        shippingDetails: checkoutDetails || undefined,
        sessionId: sessionIdRef.current,
        couponCode: appliedCoupon?.code,
        couponDiscount: couponDiscount || undefined,
        couponShippingWaived: appliedCoupon?.shippingWaived || undefined,
      });

      // Reservation is now consumed atomically inside insertOrder
      reservedRef.current = false;

      trackEvent('payment_submitted', { orderId, total: cartTotal - couponDiscount + effectiveShippingCharges, paymentMethod: 'UPI' });

      if (balancePaymentItem) {
        clearBalancePayment();
      } else {
        clearCart();
      }
      const successUrl = isAllPreOrder
        ? `/order-success?orderId=${orderId}&preOrder=true`
        : `/order-success?orderId=${orderId}`;
      redirectingRef.current = true;
      router.push(successUrl);
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err?.message || '';
      if (msg.includes('reservation expired') || msg.includes('Reservation expired') || msg.includes('not found')) {
        setError('Your stock reservation has expired. Please go back and try again.');
      } else if (msg.includes('Hyped models') || msg.includes('limited to 1')) {
        setError('Hyped models are limited to 1 per person.');
      } else if (msg.includes('already have an order') || msg.includes('hyped model')) {
        setError('You already have an order for this hyped model.');
      } else if (msg.includes('Insufficient stock') || msg.includes('stock')) {
        setError('Some items are no longer in stock. Please update your cart and try again.');
      } else if (msg.includes('Unauthorized') || msg.includes('log in')) {
        setError('Please log in to complete your order.');
      } else {
        setError('Something went wrong. Please try again or contact us on WhatsApp.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  // Show reservation error
  if (reservationError) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="glass p-12 border border-red-500/20 space-y-4">
            <h2 className="text-2xl font-display font-bold uppercase">Stock Unavailable</h2>
            <p className="text-white/40 text-sm uppercase tracking-widest">{reservationError}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Return to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
            <ArrowLeft size={14} /> Back to Store
          </Link>
          {/* Countdown Timer */}
          {expiresAt && hasInStockItems && (
            <CountdownTimer expiresAt={expiresAt} onExpired={handleExpired} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-2">Checkout</h1>
              <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Complete your purchase</p>
            </div>

            <div className="glass p-6 border border-white/10 space-y-6">
              <h2 className="text-lg font-display font-bold uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag size={18} className="text-accent" /> Order Summary
              </h2>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {balancePaymentItem ? (
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                      <NextImage
                        src={balancePaymentItem.image}
                        alt={balancePaymentItem.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-tight truncate">{balancePaymentItem.name}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Balance Payment</p>
                      <p className="text-xs font-bold text-accent mt-1">₹{(balancePaymentItem.fullPrice - 100).toLocaleString()}</p>
                    </div>
                  </div>
                ) : cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                      <NextImage
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-tight truncate">{item.name}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{item.brand} | Qty: {item.quantity}</p>
                      <p className="text-xs font-bold text-accent mt-1">₹{((isPreOrderItem(item) ? (item.bookingAdvance ?? 100) : item.price) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-green-400">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                  <span>Shipping</span>
                  <span>
                    {appliedCoupon?.shippingWaived
                      ? 'FREE (coupon)'
                      : effectiveShippingCharges > 0
                        ? `₹${effectiveShippingCharges.toLocaleString()}`
                        : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-xs font-bold uppercase tracking-widest">Total Amount</span>
                  <span className="text-3xl font-display font-bold text-white">₹{(cartTotal - couponDiscount + effectiveShippingCharges).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-accent/10 border border-accent/20 p-4 rounded-sm flex gap-3">
                <Info size={18} className="text-accent flex-shrink-0" />
                <p className="text-[10px] text-accent font-bold uppercase tracking-widest leading-relaxed">
                  MRP Pricing – No Scalping. We believe in fair prices for all collectors.
                </p>
              </div>

              {isAllPreOrder && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm flex gap-3">
                  <Info size={18} className="text-blue-400 flex-shrink-0" />
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                    {PO_SHIPPING_NOTE}
                  </p>
                </div>
              )}

              {hasInStockItems && expiresAt && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm flex gap-3">
                  <Clock size={18} className="text-yellow-400 flex-shrink-0" />
                  <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest leading-relaxed">
                    Stock is reserved for 5 minutes. Complete your payment before the timer runs out.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-8">
            <div className="glass p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16" />

              <h2 className="text-xl font-display font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-accent" /> Complete Payment via UPI
              </h2>

              <div className="space-y-8">
                {/* UPI Details */}
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative w-48 h-48 bg-white p-2 rounded-lg shadow-2xl">
                    <NextImage
                      src="/assets/QR.webp"
                      alt="UPI QR Code"
                      fill
                      sizes="192px"
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">UPI ID</p>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-sm group">
                      <span className="font-mono text-sm font-bold text-accent">{upiId}</span>
                      <button
                        onClick={handleCopyUpi}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed italic">
                    Pay using any UPI app (GPay, PhonePe, Paytm) and enter the transaction details below.
                  </p>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Transaction ID / UTR</label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter 12-digit UPI Transaction ID"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Payment Screenshot</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                        id="screenshot-upload"
                        required
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed transition-all cursor-pointer rounded-sm ${screenshot ? 'border-accent/50 bg-accent/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                      >
                        {screenshotPreview ? (
                          <div className="relative w-full h-full p-2">
                            <NextImage
                              src={screenshotPreview}
                              alt="Preview"
                              fill
                              className="object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <p className="text-[10px] font-bold uppercase tracking-widest">Change Image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload size={24} className="text-white/20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Upload Screenshot</p>
                            <p className="text-[8px] text-white/20 uppercase tracking-widest">JPG, PNG (Max 2MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !transactionId || !screenshot}
                    className="w-full bg-accent text-white py-5 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Processing...
                      </>
                    ) : isAllPreOrder ? (
                      'Pay Deposit'
                    ) : (
                      'I Have Paid – Place Order'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
